import { Request, Response } from 'express';
import { prisma } from '@nightguard/database';
import { RouterSessionManager } from '@nightguard/router-adapters';
import { RestrictionStatus } from '@nightguard/shared';

export class SystemController {
  public static async getHealth(req: Request, res: Response): Promise<void> {
    let dbStatus = 'HEALTHY';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'DEGRADED';
    }

    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'NightGuard Cloud API',
      version: '1.0.0',
      database: dbStatus,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  }

  public static async getDashboardStats(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const [
      totalNetworks,
      totalDevices,
      managedDevices,
      restrictedDevices,
      activeSchedules,
      onlineRouters,
      recentActivity,
    ] = await Promise.all([
      prisma.network.count({ where: { userId } }),
      prisma.device.count({ where: { network: { userId } } }),
      prisma.device.count({ where: { network: { userId }, isManaged: true } }),
      prisma.device.count({
        where: {
          network: { userId },
          restrictionStatus: RestrictionStatus.RESTRICTION_ACTIVE as any,
        },
      }),
      prisma.schedule.count({ where: { userId, isEnabled: true } }),
      prisma.router.count({
        where: {
          network: { userId },
          connectionStatus: 'ONLINE' as any,
        },
      }),
      prisma.auditLog.findMany({
        where: { network: { userId } },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalNetworks,
        totalDevices,
        managedDevices,
        restrictedDevices,
        activeSchedules,
        onlineRouters,
        recentActivity,
      },
    });
  }
}
