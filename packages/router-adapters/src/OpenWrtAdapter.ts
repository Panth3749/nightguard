import { RouterAdapter, RouterConfig } from './RouterAdapter';
import { RouterSessionManager } from './RouterSessionManager';
import {
  DiscoveredDevice,
  RouterCapabilities,
  RouterHealthResult,
  RouterCommandResult,
  RouterCommandType,
} from '@nightguard/shared';

export class OpenWrtAdapter implements RouterAdapter {
  public readonly id: string;
  public readonly isSimulated = false;
  private networkId: string;
  private model: string;
  private firmwareVersion: string;

  constructor(config: RouterConfig) {
    this.id = config.routerId;
    this.networkId = config.networkId;
    this.model = config.model;
    this.firmwareVersion = config.firmwareVersion;
  }

  public async initialize(): Promise<void> {
    // The OpenWrt adapter connects through the persistent outbound WebSocket session
  }

  public async testConnection(): Promise<RouterHealthResult> {
    const session = RouterSessionManager.getSession(this.id);
    if (!session || !RouterSessionManager.isOnline(this.id)) {
      return {
        isOnline: false,
        latencyMs: 0,
        firmwareVersion: this.firmwareVersion,
        model: this.model,
        activeBlockedCount: 0,
        lastError: 'Router agent is not connected. Ensure nightguard-agent is running on the router.',
      };
    }

    const start = Date.now();
    const pingResult = await RouterSessionManager.sendCommand(this.id, RouterCommandType.PING, undefined, undefined, {}, 5000);
    const latency = Date.now() - start;

    if (!pingResult.success) {
      return {
        isOnline: false,
        latencyMs: latency,
        firmwareVersion: this.firmwareVersion,
        model: this.model,
        activeBlockedCount: session.activeRestrictions.size,
        lastError: pingResult.errorMessage,
      };
    }

    return {
      isOnline: true,
      latencyMs: latency,
      firmwareVersion: this.firmwareVersion,
      model: this.model,
      activeBlockedCount: session.activeRestrictions.size,
    };
  }

  public async discoverDevices(): Promise<DiscoveredDevice[]> {
    if (!RouterSessionManager.isOnline(this.id)) {
      throw new Error(`Cannot discover devices: Router ${this.id} is offline.`);
    }

    const result = await RouterSessionManager.sendCommand(this.id, RouterCommandType.GET_CLIENTS, undefined, undefined, {}, 10000);

    if (!result.success || !result.output) {
      throw new Error(result.errorMessage || 'Failed to retrieve client leases from router.');
    }

    const devices = (result.output.clients as DiscoveredDevice[]) || [];
    RouterSessionManager.updateDiscoveredDevices(this.id, devices);
    return devices;
  }

  public async restrictDevice(mac: string, ip?: string): Promise<RouterCommandResult> {
    const normalizedMac = mac.toUpperCase();
    const result = await RouterSessionManager.sendCommand(
      this.id,
      RouterCommandType.BLOCK_MAC,
      normalizedMac,
      ip,
      { ruleAction: 'DROP_FORWARD' }
    );

    if (result.success) {
      const session = RouterSessionManager.getSession(this.id);
      if (session) {
        session.activeRestrictions.add(normalizedMac);
      }
    }

    return result;
  }

  public async restoreDevice(mac: string, ip?: string): Promise<RouterCommandResult> {
    const normalizedMac = mac.toUpperCase();
    const result = await RouterSessionManager.sendCommand(
      this.id,
      RouterCommandType.UNBLOCK_MAC,
      normalizedMac,
      ip,
      { ruleAction: 'ALLOW_FORWARD' }
    );

    if (result.success) {
      const session = RouterSessionManager.getSession(this.id);
      if (session) {
        session.activeRestrictions.delete(normalizedMac);
      }
    }

    return result;
  }

  public async getActiveRestrictions(): Promise<string[]> {
    const session = RouterSessionManager.getSession(this.id);
    if (!session || !RouterSessionManager.isOnline(this.id)) {
      return [];
    }

    const result = await RouterSessionManager.sendCommand(
      this.id,
      RouterCommandType.GET_FIREWALL_RULES,
      undefined,
      undefined,
      {},
      8000
    );

    if (result.success && result.output?.blockedMacs) {
      const blocked = (result.output.blockedMacs as string[]).map((m) => m.toUpperCase());
      RouterSessionManager.updateActiveRestrictions(this.id, blocked);
      return blocked;
    }

    return Array.from(session.activeRestrictions);
  }

  public async detectCapabilities(): Promise<RouterCapabilities> {
    return {
      supportsNftables: true,
      supportsUbus: true,
      supportsPerDeviceBandwidth: false,
      supportsDnsBlocking: true,
      supportsVlan: true,
      supportsGuestIsolation: true,
      maxManagedDevices: 256,
    };
  }

  public async emergencyRestoreAll(): Promise<RouterCommandResult> {
    const result = await RouterSessionManager.sendCommand(
      this.id,
      RouterCommandType.FLUSH_RULES,
      undefined,
      undefined,
      { set: 'nightguard_mac_blocked' }
    );

    if (result.success) {
      const session = RouterSessionManager.getSession(this.id);
      if (session) {
        session.activeRestrictions.clear();
      }
    }

    return result;
  }

  public async disconnect(): Promise<void> {
    // OpenWrt socket is managed by SessionRegistry
  }
}
