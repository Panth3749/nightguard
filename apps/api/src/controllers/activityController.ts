import { Request, Response } from 'express';
import { prisma } from '@nightguard/database';

export class ActivityController {
  public static async listActivity(req: Request, res: Response): Promise<void> {
    const { limit = '50', page = '1', networkId, action } = req.query;

    const take = parseInt(String(limit), 10);
    const skip = (parseInt(String(page), 10) - 1) * take;

    const where: any = {
      OR: [
        { userId: req.user!.userId },
        { network: { userId: req.user!.userId } },
      ],
    };

    if (networkId) where.networkId = String(networkId);
    if (action) where.action = String(action);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          network: { select: { id: true, name: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(String(page), 10),
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  }

  public static async getRecentEvents(req: Request, res: Response): Promise<void> {
    const events = await prisma.restrictionEvent.findMany({
      where: {
        device: { network: { userId: req.user!.userId } },
      },
      take: 20,
      orderBy: { triggeredAt: 'desc' },
      include: {
        device: { select: { id: true, friendlyName: true, macAddress: true, deviceType: true } },
        schedule: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: { events } });
  }
}
