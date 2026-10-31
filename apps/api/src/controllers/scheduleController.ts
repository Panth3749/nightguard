import { Request, Response } from 'express';
import { prisma } from '@nightguard/database';
import { schedulerService } from '@nightguard/scheduler';
import {
  CreateScheduleSchema,
  UpdateScheduleSchema,
  AuditAction,
  WsClientEventType,
} from '@nightguard/shared';
import { wsManager } from '../websocket/wsServer';

export class ScheduleController {
  public static async listSchedules(req: Request, res: Response): Promise<void> {
    const { networkId } = req.query;

    const where: any = { userId: req.user!.userId };
    if (networkId) where.networkId = String(networkId);

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        network: { select: { id: true, name: true } },
        scheduleDevices: {
          include: {
            device: {
              select: {
                id: true,
                friendlyName: true,
                macAddress: true,
                deviceType: true,
                isManaged: true,
                restrictionStatus: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { schedules } });
  }

  public static async createSchedule(req: Request, res: Response): Promise<void> {
    const input = CreateScheduleSchema.parse(req.body);

    const network = await prisma.network.findFirst({
      where: { id: input.networkId, userId: req.user!.userId },
    });

    if (!network) {
      res.status(404).json({ success: false, error: 'Network not found.' });
      return;
    }

    const schedule = await prisma.schedule.create({
      data: {
        userId: req.user!.userId,
        networkId: input.networkId,
        name: input.name,
        startTime: input.startTime,
        endTime: input.endTime,
        daysOfWeek: JSON.stringify(input.daysOfWeek),
        timezone: input.timezone || 'UTC',
        isEnabled: input.isEnabled ?? true,
      },
    });

    if (input.deviceIds && input.deviceIds.length > 0) {
      for (const deviceId of input.deviceIds) {
        await prisma.scheduleDevice.create({
          data: {
            scheduleId: schedule.id,
            deviceId,
          },
        });
      }
    }

    // Immediately trigger reconciliation
    await schedulerService.reconcileAllPolicies();

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        networkId: schedule.networkId,
        action: AuditAction.SCHEDULE_CREATED,
        entityType: 'SCHEDULE',
        entityId: schedule.id,
        details: JSON.stringify({ name: schedule.name, start: schedule.startTime, end: schedule.endTime }),
        ipAddress: req.ip,
      },
    });

    wsManager.broadcastToDashboard(WsClientEventType.SCHEDULE_TRIGGERED, { scheduleId: schedule.id });

    res.status(201).json({ success: true, data: { schedule } });
  }

  public static async updateSchedule(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const input = UpdateScheduleSchema.parse(req.body);

    const existing = await prisma.schedule.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Schedule not found.' });
      return;
    }

    const updated = await prisma.schedule.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        startTime: input.startTime ?? existing.startTime,
        endTime: input.endTime ?? existing.endTime,
        daysOfWeek: input.daysOfWeek ? JSON.stringify(input.daysOfWeek) : existing.daysOfWeek,
        timezone: input.timezone ?? existing.timezone,
        isEnabled: input.isEnabled ?? existing.isEnabled,
        isPaused: input.isPaused ?? existing.isPaused,
        activeOverride: (input.activeOverride as any) ?? existing.activeOverride,
      },
    });

    if (input.deviceIds) {
      // Re-assign devices
      await prisma.scheduleDevice.deleteMany({ where: { scheduleId: id } });
      for (const deviceId of input.deviceIds) {
        await prisma.scheduleDevice.create({
          data: { scheduleId: id, deviceId },
        });
      }
    }

    await schedulerService.reconcileAllPolicies();

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        networkId: updated.networkId,
        action: AuditAction.SCHEDULE_UPDATED,
        entityType: 'SCHEDULE',
        entityId: updated.id,
        details: JSON.stringify({ updates: input }),
        ipAddress: req.ip,
      },
    });

    wsManager.broadcastToDashboard(WsClientEventType.SCHEDULE_TRIGGERED, { scheduleId: updated.id });

    res.json({ success: true, data: { schedule: updated } });
  }

  public static async toggleSchedule(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const existing = await prisma.schedule.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Schedule not found.' });
      return;
    }

    const updated = await prisma.schedule.update({
      where: { id },
      data: { isEnabled: !existing.isEnabled },
    });

    await schedulerService.reconcileAllPolicies();

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        networkId: updated.networkId,
        action: AuditAction.SCHEDULE_TOGGLED,
        entityType: 'SCHEDULE',
        entityId: updated.id,
        details: JSON.stringify({ isEnabled: updated.isEnabled }),
        ipAddress: req.ip,
      },
    });

    wsManager.broadcastToDashboard(WsClientEventType.SCHEDULE_TRIGGERED, { scheduleId: updated.id });

    res.json({ success: true, data: { schedule: updated } });
  }

  public static async deleteSchedule(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const existing = await prisma.schedule.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Schedule not found.' });
      return;
    }

    await prisma.schedule.delete({ where: { id } });

    await schedulerService.reconcileAllPolicies();

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        networkId: existing.networkId,
        action: AuditAction.SCHEDULE_DELETED,
        entityType: 'SCHEDULE',
        entityId: id,
        ipAddress: req.ip,
      },
    });

    res.json({ success: true, message: 'Schedule deleted successfully.' });
  }
}
