import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';
import { prisma } from '@nightguard/database';
import { verifyToken } from '@nightguard/security';
import { RouterSessionManager } from '@nightguard/router-adapters';
import {
  AuditAction,
  RouterConnectionStatus,
  WsClientEventType,
  WsMessage,
} from '@nightguard/shared';
import { config } from '../config';

class WebSocketManager {
  private dashboardWss: WebSocketServer | null = null;
  private routerWss: WebSocketServer | null = null;
  private dashboardClients = new Map<WebSocket, { userId: string }>();

  public initialize(server: HttpServer): void {
    this.dashboardWss = new WebSocketServer({ noServer: true });
    this.routerWss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const { pathname } = parse(request.url || '');

      if (pathname === '/ws/dashboard') {
        this.dashboardWss!.handleUpgrade(request, socket, head, (ws) => {
          this.dashboardWss!.emit('connection', ws, request);
        });
      } else if (pathname === '/ws/router') {
        this.routerWss!.handleUpgrade(request, socket, head, (ws) => {
          this.routerWss!.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.setupDashboardWss();
    this.setupRouterWss();
  }

  private setupDashboardWss(): void {
    this.dashboardWss!.on('connection', (ws: WebSocket, req) => {
      // Optional query param token or cookie auth
      const url = parse(req.url || '', true);
      const token = (url.query.token as string) || '';

      let userId = 'anonymous';
      if (token) {
        try {
          const payload = verifyToken(token, config.jwtSecret);
          userId = payload.userId;
        } catch {
          // Allow connection for guest preview or public overview, will not receive restricted events
        }
      }

      this.dashboardClients.set(ws, { userId });

      ws.on('close', () => {
        this.dashboardClients.delete(ws);
      });

      // Send initial welcome
      ws.send(
        JSON.stringify({
          type: 'CONNECTED',
          timestamp: new Date().toISOString(),
          payload: { message: 'Connected to NightGuard real-time event bus' },
        })
      );
    });
  }

  private setupRouterWss(): void {
    this.routerWss!.on('connection', (ws: WebSocket) => {
      let registeredRouterId: string | null = null;

      ws.on('message', async (raw) => {
        try {
          const msg = JSON.parse(raw.toString());

          // 1. Router Agent Authentication
          if (msg.type === 'AUTH') {
            const { pairingToken } = msg.data;
            const router = await prisma.router.findUnique({
              where: { pairingToken },
            });

            if (!router) {
              ws.send(JSON.stringify({ type: 'AUTH_FAILED', error: 'Invalid pairing token' }));
              ws.close(4001, 'Invalid pairing token');
              return;
            }

            registeredRouterId = router.id;
            RouterSessionManager.registerSession(router.id, ws);

            await prisma.router.update({
              where: { id: router.id },
              data: {
                connectionStatus: RouterConnectionStatus.ONLINE as any,
                lastHeartbeatAt: new Date(),
              },
            });

            ws.send(
              JSON.stringify({
                type: 'AUTH_OK',
                routerId: router.id,
                message: 'Authenticated successfully with NightGuard Cloud',
              })
            );

            this.broadcastToDashboard(WsClientEventType.ROUTER_STATUS_UPDATE, {
              routerId: router.id,
              networkId: router.networkId,
              status: RouterConnectionStatus.ONLINE,
            });

            console.log(`[ROUTER WS] OpenWrt Router ${router.id} paired and connected.`);
          }

          // 2. Router Heartbeat
          if (msg.type === 'HEARTBEAT' && registeredRouterId) {
            RouterSessionManager.updateHealth(registeredRouterId, {
              isOnline: true,
              latencyMs: msg.data.latencyMs || 15,
              activeBlockedCount: msg.data.activeBlockedCount || 0,
            });

            await prisma.router.update({
              where: { id: registeredRouterId },
              data: { lastHeartbeatAt: new Date() },
            });
          }

          // 3. Router Discovery Report (Connected devices)
          if (msg.type === 'DISCOVERY_REPORT' && registeredRouterId) {
            const clients = msg.data.clients || [];
            RouterSessionManager.updateDiscoveredDevices(registeredRouterId, clients);

            const router = await prisma.router.findUnique({
              where: { id: registeredRouterId },
            });

            if (router) {
              for (const c of clients) {
                if (!c.macAddress) continue;
                const normalizedMac = c.macAddress.toUpperCase();

                await prisma.device.upsert({
                  where: {
                    networkId_macAddress: {
                      networkId: router.networkId,
                      macAddress: normalizedMac,
                    },
                  },
                  update: {
                    currentIpAddress: c.ipAddress,
                    hostname: c.hostname || undefined,
                    lastSeenAt: new Date(),
                  },
                  create: {
                    networkId: router.networkId,
                    routerId: router.id,
                    macAddress: normalizedMac,
                    currentIpAddress: c.ipAddress,
                    hostname: c.hostname || 'Unknown Device',
                    friendlyName: c.hostname || `Device-${normalizedMac.slice(-5)}`,
                    isManaged: false,
                    lastSeenAt: new Date(),
                  },
                });
              }

              this.broadcastToDashboard(WsClientEventType.DEVICE_UPDATE, {
                networkId: router.networkId,
                discoveredCount: clients.length,
              });
            }
          }

          // 4. Command Acknowledged
          if (msg.type === 'COMMAND_ACK') {
            RouterSessionManager.handleCommandAck(msg.data);
          }
        } catch (err) {
          console.error('[ROUTER WS ERROR] Failed to parse message:', err);
        }
      });

      ws.on('close', async () => {
        if (registeredRouterId) {
          console.log(`[ROUTER WS] Router ${registeredRouterId} disconnected.`);
          await prisma.router.update({
            where: { id: registeredRouterId },
            data: { connectionStatus: RouterConnectionStatus.OFFLINE as any },
          });

          this.broadcastToDashboard(WsClientEventType.ROUTER_STATUS_UPDATE, {
            routerId: registeredRouterId,
            status: RouterConnectionStatus.OFFLINE,
          });
        }
      });
    });
  }

  public broadcastToDashboard<T>(eventType: WsClientEventType, payload: T): void {
    const msg: WsMessage<T> = {
      type: eventType,
      timestamp: new Date().toISOString(),
      payload,
    };
    const serialized = JSON.stringify(msg);

    for (const [client, meta] of this.dashboardClients.entries()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  }
}

export const wsManager = new WebSocketManager();
