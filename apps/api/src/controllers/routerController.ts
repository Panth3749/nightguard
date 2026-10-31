import { Request, Response } from 'express';
import { prisma } from '@nightguard/database';
import { generateSecureToken } from '@nightguard/security';
import { AdapterFactory } from '@nightguard/router-adapters';
import {
  PairRouterSchema,
  AuditAction,
  RouterConnectionStatus,
  RouterAdapterType,
  WsClientEventType,
  DeviceType,
} from '@nightguard/shared';
import { wsManager } from '../websocket/wsServer';

export class RouterController {
  public static async pairRouter(req: Request, res: Response): Promise<void> {
    const input = PairRouterSchema.parse(req.body);

    const network = await prisma.network.findFirst({
      where: { id: input.networkId, userId: req.user!.userId },
    });

    if (!network) {
      res.status(404).json({ success: false, error: 'Network not found.' });
      return;
    }

    const pairingToken = generateSecureToken('ng_pair', 16);
    const pairingExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const routerModel = input.model || (input.isSimulated ? 'Wi-Fi Smart Router (Connected)' : 'OpenWrt 23.05+ Gateway');
    const isInstant = input.isSimulated || input.adapterType === RouterAdapterType.SIMULATOR || !!input.model;

    const router = await prisma.router.create({
      data: {
        networkId: network.id,
        model: routerModel,
        firmwareVersion: input.isSimulated ? 'v24.1-smart' : 'RouterOS-v2.1',
        adapterType: input.adapterType as any,
        pairingToken,
        pairingExpiresAt,
        isSimulated: input.isSimulated,
        connectionStatus: isInstant
          ? (RouterConnectionStatus.ONLINE as any)
          : (RouterConnectionStatus.PAIRING as any),
        capabilities: {
          create: {
            supportsNftables: true,
            supportsUbus: true,
            supportsPerDeviceBandwidth: true,
            supportsDnsBlocking: true,
            supportsVlan: true,
            supportsGuestIsolation: true,
            maxManagedDevices: 256,
          },
        },
      },
      include: { capabilities: true },
    });

    // Automatically discover and sync devices for the network
    if (isInstant) {
      const adapter = AdapterFactory.getAdapter({
        routerId: router.id,
        networkId: network.id,
        model: router.model,
        firmwareVersion: router.firmwareVersion,
        isSimulated: true,
        adapterType: RouterAdapterType.SIMULATOR,
      });

      const devices = await adapter.discoverDevices();
      for (const d of devices) {
        let devType: DeviceType = DeviceType.OTHER;
        const nameLower = (d.hostname || '').toLowerCase();
        if (nameLower.includes('phone') || nameLower.includes('iphone')) devType = DeviceType.SMARTPHONE;
        else if (nameLower.includes('laptop') || nameLower.includes('macbook')) devType = DeviceType.LAPTOP;
        else if (nameLower.includes('tablet') || nameLower.includes('ipad')) devType = DeviceType.TABLET;
        else if (nameLower.includes('tv')) devType = DeviceType.SMART_TV;
        else if (nameLower.includes('gaming') || nameLower.includes('desktop')) devType = DeviceType.GAMING_CONSOLE;

        await prisma.device.upsert({
          where: {
            networkId_macAddress: {
              networkId: network.id,
              macAddress: d.macAddress.toUpperCase(),
            },
          },
          update: {
            currentIpAddress: d.ipAddress,
            hostname: d.hostname,
            lastSeenAt: new Date(),
          },
          create: {
            networkId: network.id,
            routerId: router.id,
            macAddress: d.macAddress.toUpperCase(),
            currentIpAddress: d.ipAddress,
            hostname: d.hostname || 'Connected Device',
            friendlyName: d.hostname || `Device-${d.macAddress.slice(-5)}`,
            deviceType: devType as any,
            isManaged: false,
            lastSeenAt: new Date(),
          },
        });
      }
    }

    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const host = req.get('host') || 'nightguard-api-6ukp.onrender.com';
    const baseUrl = `${protocol}://${host}`;
    const installCommand = `sh <(curl -sSL ${baseUrl}/agent/install.sh) --token ${pairingToken}`;

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        networkId: network.id,
        action: AuditAction.ROUTER_PAIR_REQUESTED,
        entityType: 'ROUTER',
        entityId: router.id,
        details: JSON.stringify({ isSimulated: input.isSimulated, adapterType: input.adapterType }),
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        router,
        pairingToken,
        pairingExpiresAt,
        installCommand,
        instructions:
          'SSH into your OpenWrt router and run the command above. The agent will initiate an outbound encrypted connection to NightGuard.',
      },
    });
  }

  public static async listRouters(req: Request, res: Response): Promise<void> {
    const routers = await prisma.router.findMany({
      where: { network: { userId: req.user!.userId } },
      include: {
        capabilities: true,
        network: { select: { id: true, name: true, ssid: true } },
        _count: { select: { devices: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { routers } });
  }

  public static async getRouterStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const router = await prisma.router.findFirst({
      where: { id, network: { userId: req.user!.userId } },
      include: { capabilities: true },
    });

    if (!router) {
      res.status(404).json({ success: false, error: 'Router not found.' });
      return;
    }

    const adapter = AdapterFactory.getAdapter({
      routerId: router.id,
      networkId: router.networkId,
      model: router.model,
      firmwareVersion: router.firmwareVersion,
      isSimulated: router.isSimulated,
      adapterType: router.adapterType as any,
    });

    const health = await adapter.testConnection();

    const newStatus = health.isOnline ? RouterConnectionStatus.ONLINE : RouterConnectionStatus.OFFLINE;

    if (router.connectionStatus !== newStatus) {
      await prisma.router.update({
        where: { id: router.id },
        data: {
          connectionStatus: newStatus as any,
          lastHeartbeatAt: health.isOnline ? new Date() : router.lastHeartbeatAt,
        },
      });
    }

    res.json({
      success: true,
      data: {
        router,
        health,
      },
    });
  }

  public static async syncDevices(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const router = await prisma.router.findFirst({
      where: { id, network: { userId: req.user!.userId } },
    });

    if (!router) {
      res.status(404).json({ success: false, error: 'Router not found.' });
      return;
    }

    const adapter = AdapterFactory.getAdapter({
      routerId: router.id,
      networkId: router.networkId,
      model: router.model,
      firmwareVersion: router.firmwareVersion,
      isSimulated: router.isSimulated,
      adapterType: router.adapterType as any,
    });

    try {
      const discovered = await adapter.discoverDevices();

      for (const d of discovered) {
        if (!d.macAddress) continue;
        const normalizedMac = d.macAddress.toUpperCase();

        await prisma.device.upsert({
          where: {
            networkId_macAddress: {
              networkId: router.networkId,
              macAddress: normalizedMac,
            },
          },
          update: {
            currentIpAddress: d.ipAddress,
            hostname: d.hostname || undefined,
            lastSeenAt: new Date(),
          },
          create: {
            networkId: router.networkId,
            routerId: router.id,
            macAddress: normalizedMac,
            currentIpAddress: d.ipAddress,
            hostname: d.hostname || 'Discovered Device',
            friendlyName: d.hostname || `Device-${normalizedMac.slice(-5)}`,
            isManaged: false,
            lastSeenAt: new Date(),
          },
        });
      }

      wsManager.broadcastToDashboard(WsClientEventType.DEVICE_UPDATE, {
        networkId: router.networkId,
        count: discovered.length,
      });

      res.json({
        success: true,
        data: {
          syncedCount: discovered.length,
          devices: discovered,
        },
      });
    } catch (err: any) {
      res.status(502).json({
        success: false,
        error: `Device synchronization failed: ${err.message}`,
      });
    }
  }

  public static async emergencyRestore(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const router = await prisma.router.findFirst({
      where: { id, network: { userId: req.user!.userId } },
    });

    if (!router) {
      res.status(404).json({ success: false, error: 'Router not found.' });
      return;
    }

    const adapter = AdapterFactory.getAdapter({
      routerId: router.id,
      networkId: router.networkId,
      model: router.model,
      firmwareVersion: router.firmwareVersion,
      isSimulated: router.isSimulated,
      adapterType: router.adapterType as any,
    });

    const result = await adapter.emergencyRestoreAll();

    // Reset managed devices to SCHEDULED
    await prisma.device.updateMany({
      where: { networkId: router.networkId, isManaged: true },
      data: { restrictionStatus: 'SCHEDULED' as any },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        networkId: router.networkId,
        action: AuditAction.EMERGENCY_OVERRIDE,
        entityType: 'ROUTER',
        entityId: router.id,
        details: JSON.stringify({ message: 'Emergency restore executed on router.' }),
        ipAddress: req.ip,
      },
    });

    wsManager.broadcastToDashboard(WsClientEventType.RESTRICTION_EVENT, {
      routerId: router.id,
      action: 'EMERGENCY_FLUSH_COMPLETED',
    });

    res.json({
      success: true,
      data: { result, message: 'All router firewall rules have been flushed and restored.' },
    });
  }
}
