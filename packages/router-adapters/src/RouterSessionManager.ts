import { WebSocket } from 'ws';
import {
  RouterCommandType,
  RouterCommandPayload,
  RouterCommandResult,
  DiscoveredDevice,
  RouterHealthResult,
} from '@nightguard/shared';

interface ActiveSession {
  routerId: string;
  ws: WebSocket;
  connectedAt: Date;
  lastPing: Date;
  health: RouterHealthResult;
  discoveredDevices: DiscoveredDevice[];
  activeRestrictions: Set<string>;
}

type CommandCallback = (result: RouterCommandResult) => void;

class RouterSessionRegistry {
  private sessions = new Map<string, ActiveSession>();
  private pendingCommands = new Map<string, { resolve: CommandCallback; timeout: NodeJS.Timeout }>();

  public registerSession(routerId: string, ws: WebSocket): void {
    const session: ActiveSession = {
      routerId,
      ws,
      connectedAt: new Date(),
      lastPing: new Date(),
      health: {
        isOnline: true,
        latencyMs: 15,
        activeBlockedCount: 0,
      },
      discoveredDevices: [],
      activeRestrictions: new Set<string>(),
    };

    this.sessions.set(routerId, session);

    ws.on('close', () => {
      this.sessions.delete(routerId);
    });
  }

  public getSession(routerId: string): ActiveSession | undefined {
    return this.sessions.get(routerId);
  }

  public isOnline(routerId: string): boolean {
    const session = this.sessions.get(routerId);
    return !!session && session.ws.readyState === WebSocket.OPEN;
  }

  public updateHealth(routerId: string, health: Partial<RouterHealthResult>): void {
    const session = this.sessions.get(routerId);
    if (session) {
      session.health = { ...session.health, ...health, isOnline: true };
      session.lastPing = new Date();
    }
  }

  public updateDiscoveredDevices(routerId: string, devices: DiscoveredDevice[]): void {
    const session = this.sessions.get(routerId);
    if (session) {
      session.discoveredDevices = devices;
    }
  }

  public updateActiveRestrictions(routerId: string, blockedMacs: string[]): void {
    const session = this.sessions.get(routerId);
    if (session) {
      session.activeRestrictions = new Set(blockedMacs.map((m) => m.toUpperCase()));
      session.health.activeBlockedCount = blockedMacs.length;
    }
  }

  public async sendCommand(
    routerId: string,
    type: RouterCommandType,
    targetMac?: string,
    targetIp?: string,
    payload?: Record<string, unknown>,
    timeoutMs = 10000
  ): Promise<RouterCommandResult> {
    const session = this.sessions.get(routerId);

    if (!session || session.ws.readyState !== WebSocket.OPEN) {
      return {
        commandId: 'err',
        success: false,
        executedAt: new Date().toISOString(),
        errorMessage: 'Router is currently offline or unreachable. Command aborted.',
      };
    }

    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const idempotencyKey = `${routerId}:${type}:${targetMac || 'all'}:${Date.now()}`;

    const commandMessage: RouterCommandPayload = {
      commandId,
      type,
      targetMac: targetMac?.toUpperCase(),
      targetIp,
      idempotencyKey,
      issuedAt: new Date().toISOString(),
      payload,
    };

    return new Promise<RouterCommandResult>((resolve) => {
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(commandId);
        resolve({
          commandId,
          success: false,
          executedAt: new Date().toISOString(),
          errorMessage: `Command timed out after ${timeoutMs / 1000} seconds without router acknowledgement.`,
        });
      }, timeoutMs);

      this.pendingCommands.set(commandId, { resolve, timeout });

      session.ws.send(JSON.stringify({ type: 'COMMAND', data: commandMessage }));
    });
  }

  public handleCommandAck(result: RouterCommandResult): void {
    const pending = this.pendingCommands.get(result.commandId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingCommands.delete(result.commandId);
      pending.resolve(result);
    }
  }
}

export const RouterSessionManager = new RouterSessionRegistry();
