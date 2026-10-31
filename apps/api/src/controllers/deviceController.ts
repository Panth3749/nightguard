import { Request, Response } from 'express';
import { prisma } from '@nightguard/database';
import { schedulerService } from '@nightguard/scheduler';
import {
  UpdateDeviceSchema,
  ToggleDeviceManagementSchema,
  ManualDeviceOverrideSchema,
  AuditAction,
  RestrictionStatus,
  WsClientEventType,
} from '@nightguard/shared';
import { wsManager } from '../websocket/wsServer';

export class DeviceController {
  public static async listDevices(req: Request, res: Response): Promise<void> {
    const { networkId, search, type, isManaged, restrictionStatus } = req.query;

    const where: any = {
      network: { userId: req.user!.userId },
    };

    if (networkId) where.networkId = String(networkId);
    if (type) where.deviceType = String(type);
    if (isManaged !== undefined) where.isManaged = isManaged === 'true';
    if (restrictionStatus) where.restrictionStatus = String(restrictionStatus);

    if (search) {
      where.OR = [
        { friendlyName: { contains: String(search), mode: 'insensitive' } },
        { hostname: { contains: String(search), mode: 'insensitive' } },
        { macAddress: { contains: String(search), mode: 'insensitive' } },
        { currentIpAddress: { contains: String(search) } },
      ];
    }

    const devices = await prisma.device.findMany({
      where,
      include: {
        network: { select: { id: true, name: true, ssid: true } },
        router: { select: { id: true, model: true, connectionStatus: true, isSimulated: true } },
        scheduleDevices: {
          include: {
            schedule: { select: { id: true, name: true, startTime: true, endTime: true, isEnabled: true } },
          },
        },
      },
      orderBy: [{ isManaged: 'desc' }, { lastSeenAt: 'desc' }],
    });

    res.json({ success: true, data: { devices } });
  }

  public static async getDevice(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const device = await prisma.device.findFirst({
      where: { id, network: { userId: req.user!.userId } },
      include: {
        network: true,
        router: true,
        scheduleDevices: { include: { schedule: true } },
        restrictionEvents: { take: 10, orderBy: { createdAt: 'desc' } },
        history: { take: 10, orderBy: { timestamp: 'desc' } },
      },
    });

    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found.' });
      return;
    }

    res.json({ success: true, data: { device } });
  }

  public static async updateDevice(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const input = UpdateDeviceSchema.parse(req.body);

    const device = await prisma.device.findFirst({
      where: { id, network: { userId: req.user!.userId } },
    });

    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found.' });
      return;
    }

    const updated = await prisma.device.update({
      where: { id },
      data: {
        friendlyName: input.friendlyName ?? device.friendlyName,
        deviceType: (input.deviceType as any) ?? device.deviceType,
        notes: input.notes ?? device.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        networkId: device.networkId,
        action: AuditAction.DEVICE_UPDATED,
        entityType: 'DEVICE',
        entityId: device.id,
        details: JSON.stringify({ updates: input }),
        ipAddress: req.ip,
      },
    });

    wsManager.broadcastToDashboard(WsClientEventType.DEVICE_UPDATE, { device: updated });

    res.json({ success: true, data: { device: updated } });
  }

  public static async toggleManagement(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const input = ToggleDeviceManagementSchema.parse(req.body);

    const device = await prisma.device.findFirst({
      where: { id, network: { userId: req.user!.userId } },
    });

    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found.' });
      return;
    }

    const updated = await prisma.device.update({
      where: { id },
      data: {
        isManaged: input.isManaged,
        restrictionStatus: input.isManaged ? ('SCHEDULED' as any) : ('NOT_MANAGED' as any),
      },
    });

    // Reconcile router rules immediately
    await schedulerService.reconcileDeviceById(device.id);

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        networkId: device.networkId,
        action: AuditAction.MANAGEMENT_TOGGLED,
        entityType: 'DEVICE',
        entityId: device.id,
        details: JSON.stringify({ isManaged: input.isManaged }),
        ipAddress: req.ip,
      },
    });

    wsManager.broadcastToDashboard(WsClientEventType.DEVICE_UPDATE, { device: updated });

    res.json({
      success: true,
      data: {
        device: updated,
        message: input.isManaged
          ? `Management enabled for ${device.friendlyName}. Active schedules will now apply.`
          : `Management disabled for ${device.friendlyName}. Device is excluded from all restrictions.`,
      },
    });
  }

  public static async manualRestrict(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const device = await prisma.device.findFirst({
      where: { id, network: { userId: req.user!.userId } },
      include: { router: true },
    });

    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found.' });
      return;
    }

    if (!device.isManaged) {
      res.status(400).json({
        success: false,
        error: 'Cannot restrict an unmanaged device. Please enable management for this device first.',
      });
      return;
    }

    // Update status to RESTRICTION_ACTIVE
    await prisma.device.update({
      where: { id: device.id },
      data: { restrictionStatus: RestrictionStatus.RESTRICTION_ACTIVE as any },
    });

    await schedulerService.reconcileDeviceById(device.id);

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        networkId: device.networkId,
        action: AuditAction.MANUAL_OVERRIDE,
        entityType: 'DEVICE',
        entityId: device.id,
        details: JSON.stringify({ action: 'RESTRICT_NOW' }),
        ipAddress: req.ip,
      },
    });

    wsManager.broadcastToDashboard(WsClientEventType.RESTRICTION_EVENT, {
      deviceId: device.id,
      action: 'MANUAL_RESTRICT',
    });

    res.json({ success: true, message: `Access restricted for ${device.friendlyName}.` });
  }

  public static async manualRestore(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const device = await prisma.device.findFirst({
      where: { id, network: { userId: req.user!.userId } },
      include: { router: true },
    });

    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found.' });
      return;
    }

    await prisma.device.update({
      where: { id: device.id },
      data: { restrictionStatus: RestrictionStatus.SCHEDULED as any },
    });

    await schedulerService.reconcileDeviceById(device.id);

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        networkId: device.networkId,
        action: AuditAction.MANUAL_OVERRIDE,
        entityType: 'DEVICE',
        entityId: device.id,
        details: JSON.stringify({ action: 'RESTORE_NOW' }),
        ipAddress: req.ip,
      },
    });

    wsManager.broadcastToDashboard(WsClientEventType.RESTRICTION_EVENT, {
      deviceId: device.id,
      action: 'MANUAL_RESTORE',
    });

    res.json({ success: true, message: `Access restored for ${device.friendlyName}.` });
  }
}
