import { Request, Response } from 'express';
import { prisma } from '@nightguard/database';
import { CreateNetworkSchema, AuditAction } from '@nightguard/shared';

export class NetworkController {
  public static async listNetworks(req: Request, res: Response): Promise<void> {
    const networks = await prisma.network.findMany({
      where: { userId: req.user!.userId },
      include: {
        routers: {
          select: {
            id: true,
            model: true,
            firmwareVersion: true,
            connectionStatus: true,
            adapterType: true,
            isSimulated: true,
            lastHeartbeatAt: true,
            pairingToken: true,
          },
        },
        _count: {
          select: {
            devices: true,
            schedules: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { networks } });
  }

  public static async createNetwork(req: Request, res: Response): Promise<void> {
    const input = CreateNetworkSchema.parse(req.body);

    const network = await prisma.network.create({
      data: {
        userId: req.user!.userId,
        name: input.name,
        ssid: input.ssid,
        description: input.description,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        networkId: network.id,
        action: AuditAction.NETWORK_CREATED,
        entityType: 'NETWORK',
        entityId: network.id,
        details: JSON.stringify({ name: network.name, ssid: network.ssid }),
        ipAddress: req.ip,
      },
    });

    res.status(201).json({ success: true, data: { network } });
  }

  public static async getNetwork(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const network = await prisma.network.findFirst({
      where: { id, userId: req.user!.userId },
      include: {
        routers: true,
        devices: true,
        schedules: {
          include: {
            scheduleDevices: {
              include: { device: true },
            },
          },
        },
      },
    });

    if (!network) {
      res.status(404).json({ success: false, error: 'Network not found.' });
      return;
    }

    res.json({ success: true, data: { network } });
  }

  public static async deleteNetwork(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const network = await prisma.network.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!network) {
      res.status(404).json({ success: false, error: 'Network not found.' });
      return;
    }

    await prisma.network.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: AuditAction.NETWORK_DELETED,
        entityType: 'NETWORK',
        entityId: id,
        ipAddress: req.ip,
      },
    });

    res.json({ success: true, message: 'Network deleted successfully.' });
  }
}
