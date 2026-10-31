import { prisma } from '@nightguard/database';
import { AdapterFactory } from '@nightguard/router-adapters';
import {
  AuditAction,
  RestrictionStatus,
  RouterAdapterType,
  RouterConnectionStatus,
} from '@nightguard/shared';
import { PolicyEngine } from './policyEngine';

export interface SchedulerConfig {
  checkIntervalMs?: number;
  enableBullMq?: boolean;
  redisUrl?: string;
}

export class SchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkIntervalMs: number;

  constructor(config: SchedulerConfig = {}) {
    this.checkIntervalMs = config.checkIntervalMs || 30000; // Check every 30 seconds
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[SCHEDULER] NightGuard policy scheduler engine started (Interval: ${this.checkIntervalMs / 1000}s)`);

    // Run immediate reconciliation on startup (restart recovery)
    await this.recoverMissedEvents();

    this.timer = setInterval(async () => {
      try {
        await this.reconcileAllPolicies();
      } catch (err) {
        console.error('[SCHEDULER] Error during periodic policy reconciliation:', err);
      }
    }, this.checkIntervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[SCHEDULER] Policy scheduler engine stopped.');
  }

  /**
   * Recovers from server restarts by reconciling all device states against actual database schedules
   * and router firewall rules.
   */
  public async recoverMissedEvents(): Promise<void> {
    console.log('[SCHEDULER] Executing server restart recovery check...');
    await this.reconcileAllPolicies();
  }

  /**
   * Evaluates all devices and executes restriction/restoration commands where required.
   */
  public async reconcileAllPolicies(): Promise<void> {
    const devices = await prisma.device.findMany({
      include: {
        router: true,
        scheduleDevices: {
          include: {
            schedule: true,
          },
        },
        restrictionPolicy: true,
      },
    });

    for (const device of devices) {
      await this.enforcePolicyForDevice(device);
    }
  }

  /**
   * Reconciles policy for a single device (e.g. after editing schedule or toggling management)
   */
  public async reconcileDeviceById(deviceId: string): Promise<void> {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        router: true,
        scheduleDevices: {
          include: {
            schedule: true,
          },
        },
        restrictionPolicy: true,
      },
    });

    if (device) {
      await this.enforcePolicyForDevice(device);
    }
  }

  private async enforcePolicyForDevice(device: any): Promise<void> {
    const evaluation = PolicyEngine.evaluateDevice(device);

    // If device is NOT managed: ensure it is not restricted
    if (!device.isManaged) {
      if (device.restrictionStatus !== RestrictionStatus.NOT_MANAGED) {
        if (device.router) {
          const adapter = AdapterFactory.getAdapter({
            routerId: device.router.id,
            networkId: device.networkId,
            model: device.router.model,
            firmwareVersion: device.router.firmwareVersion,
            isSimulated: device.router.isSimulated,
            adapterType: (device.router.adapterType as RouterAdapterType) || RouterAdapterType.OPENWRT,
          });
          await adapter.restoreDevice(device.macAddress, device.currentIpAddress || undefined);
        }

        await prisma.device.update({
          where: { id: device.id },
          data: { restrictionStatus: RestrictionStatus.NOT_MANAGED as any },
        });

        await prisma.auditLog.create({
          data: {
            networkId: device.networkId,
            action: AuditAction.MANAGEMENT_TOGGLED,
            entityType: 'DEVICE',
            entityId: device.id,
            details: JSON.stringify({ mac: device.macAddress, isManaged: false }),
          },
        });
      }
      return;
    }

    // Device IS managed: check if router is offline
    const isRouterOnline =
      device.router?.connectionStatus === RouterConnectionStatus.ONLINE || device.router?.isSimulated;

    if (!isRouterOnline) {
      if (device.restrictionStatus !== RestrictionStatus.ROUTER_OFFLINE) {
        await prisma.device.update({
          where: { id: device.id },
          data: { restrictionStatus: RestrictionStatus.ROUTER_OFFLINE as any },
        });
      }
      return;
    }

    const adapter = AdapterFactory.getAdapter({
      routerId: device.router.id,
      networkId: device.networkId,
      model: device.router.model,
      firmwareVersion: device.router.firmwareVersion,
      isSimulated: device.router.isSimulated,
      adapterType: (device.router.adapterType as RouterAdapterType) || RouterAdapterType.OPENWRT,
    });

    const isCurrentlyRestricted = device.restrictionStatus === RestrictionStatus.RESTRICTION_ACTIVE;

    // Transition 1: Needs to be restricted, but not currently restricted
    if (evaluation.shouldBeRestricted && !isCurrentlyRestricted) {
      console.log(`[SCHEDULER] Applying restriction for device ${device.friendlyName} (${device.macAddress})`);

      // Set state to PENDING
      await prisma.device.update({
        where: { id: device.id },
        data: { restrictionStatus: RestrictionStatus.PENDING as any },
      });

      const result = await adapter.restrictDevice(device.macAddress, device.currentIpAddress || undefined);

      const finalStatus = result.success ? RestrictionStatus.RESTRICTION_ACTIVE : RestrictionStatus.FAILED;

      await prisma.device.update({
        where: { id: device.id },
        data: { restrictionStatus: finalStatus as any },
      });

      await prisma.restrictionEvent.create({
        data: {
          deviceId: device.id,
          scheduleId: evaluation.activeScheduleId || null,
          routerId: device.router.id,
          eventType: evaluation.isOverrideActive ? 'MANUAL_RESTRICT' : 'SCHEDULE_RESTRICT',
          status: result.success ? 'ACKNOWLEDGED' : 'FAILED',
          completedAt: new Date(),
          details: JSON.stringify({ reason: evaluation.reason, output: result.output, error: result.errorMessage }),
        },
      });

      await prisma.auditLog.create({
        data: {
          networkId: device.networkId,
          action: result.success ? AuditAction.RESTRICTION_APPLIED : AuditAction.COMMAND_FAILED,
          entityType: 'DEVICE',
          entityId: device.id,
          details: JSON.stringify({
            friendlyName: device.friendlyName,
            mac: device.macAddress,
            reason: evaluation.reason,
            success: result.success,
          }),
        },
      });
    }

    // Transition 2: Needs to be restored, but is currently restricted
    if (!evaluation.shouldBeRestricted && isCurrentlyRestricted) {
      console.log(`[SCHEDULER] Restoring access for device ${device.friendlyName} (${device.macAddress})`);

      await prisma.device.update({
        where: { id: device.id },
        data: { restrictionStatus: RestrictionStatus.RESTORATION_PENDING as any },
      });

      const result = await adapter.restoreDevice(device.macAddress, device.currentIpAddress || undefined);

      const finalStatus = result.success ? RestrictionStatus.SCHEDULED : RestrictionStatus.FAILED;

      await prisma.device.update({
        where: { id: device.id },
        data: { restrictionStatus: finalStatus as any },
      });

      await prisma.restrictionEvent.create({
        data: {
          deviceId: device.id,
          scheduleId: evaluation.activeScheduleId || null,
          routerId: device.router.id,
          eventType: evaluation.isOverrideActive ? 'MANUAL_RESTORE' : 'SCHEDULE_RESTORE',
          status: result.success ? 'ACKNOWLEDGED' : 'FAILED',
          completedAt: new Date(),
          details: JSON.stringify({ reason: evaluation.reason, output: result.output, error: result.errorMessage }),
        },
      });

      await prisma.auditLog.create({
        data: {
          networkId: device.networkId,
          action: result.success ? AuditAction.RESTORATION_APPLIED : AuditAction.COMMAND_FAILED,
          entityType: 'DEVICE',
          entityId: device.id,
          details: JSON.stringify({
            friendlyName: device.friendlyName,
            mac: device.macAddress,
            reason: evaluation.reason,
            success: result.success,
          }),
        },
      });
    }

    // If device is scheduled and unrestricted, keep status as SCHEDULED
    if (!evaluation.shouldBeRestricted && device.restrictionStatus !== RestrictionStatus.SCHEDULED) {
      await prisma.device.update({
        where: { id: device.id },
        data: { restrictionStatus: RestrictionStatus.SCHEDULED as any },
      });
    }
  }

  /**
   * Emergency override: completely unblocks all devices across all routers on a network.
   */
  public async emergencyOverride(networkId: string, userId: string): Promise<void> {
    console.log(`[SCHEDULER] Emergency override initiated for network: ${networkId}`);

    const routers = await prisma.router.findMany({ where: { networkId } });

    for (const r of routers) {
      const adapter = AdapterFactory.getAdapter({
        routerId: r.id,
        networkId: r.networkId,
        model: r.model,
        firmwareVersion: r.firmwareVersion,
        isSimulated: r.isSimulated,
        adapterType: (r.adapterType as RouterAdapterType) || RouterAdapterType.OPENWRT,
      });
      await adapter.emergencyRestoreAll();
    }

    // Update all managed devices on network to SCHEDULED
    await prisma.device.updateMany({
      where: { networkId, isManaged: true },
      data: { restrictionStatus: RestrictionStatus.SCHEDULED as any },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        networkId,
        action: AuditAction.EMERGENCY_OVERRIDE,
        entityType: 'NETWORK',
        entityId: networkId,
        details: JSON.stringify({ message: 'Emergency override triggered: all firewall restrictions cleared.' }),
      },
    });
  }
}

export const schedulerService = new SchedulerService();
