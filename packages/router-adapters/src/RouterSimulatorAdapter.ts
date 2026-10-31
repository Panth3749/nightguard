import { RouterAdapter, RouterConfig } from './RouterAdapter';
import {
  DiscoveredDevice,
  RouterCapabilities,
  RouterHealthResult,
  RouterCommandResult,
} from '@nightguard/shared';

export class RouterSimulatorAdapter implements RouterAdapter {
  public readonly id: string;
  public readonly isSimulated = true;
  private networkId: string;
  private simulatedBlockedMacs = new Set<string>();
  private simulatedClients: DiscoveredDevice[] = [];
  public simulateFailure = false;
  public simulateOffline = false;

  constructor(config: RouterConfig) {
    this.id = config.routerId;
    this.networkId = config.networkId;
    this.initializeDefaultDevices();
  }

  private initializeDefaultDevices(): void {
    this.simulatedClients = [
      {
        macAddress: '4A:72:9D:31:AA:01',
        ipAddress: '192.168.1.101',
        hostname: "Panth's Phone",
        vendor: 'Apple, Inc.',
        interface: 'wlan0',
        signalStrength: -48,
        lastSeen: new Date(),
      },
      {
        macAddress: '3C:22:FB:44:BB:02',
        ipAddress: '192.168.1.102',
        hostname: 'Laptop',
        vendor: 'Apple, Inc.',
        interface: 'wlan0',
        signalStrength: -55,
        lastSeen: new Date(),
      },
      {
        macAddress: '88:66:5A:77:CC:03',
        ipAddress: '192.168.1.103',
        hostname: 'Family Tablet',
        vendor: 'Apple, Inc.',
        interface: 'wlan1',
        signalStrength: -62,
        lastSeen: new Date(),
      },
      {
        macAddress: 'FC:F5:28:99:DD:04',
        ipAddress: '192.168.1.104',
        hostname: 'Smart TV',
        vendor: 'LG Electronics',
        interface: 'eth0',
        signalStrength: 0,
        lastSeen: new Date(),
      },
      {
        macAddress: '70:85:C2:AA:EE:05',
        ipAddress: '192.168.1.105',
        hostname: 'Gaming PC',
        vendor: 'Micro-Star Int.',
        interface: 'eth1',
        signalStrength: 0,
        lastSeen: new Date(),
      },
    ];
  }

  public async initialize(): Promise<void> {
    console.log(`[SIMULATOR] Initialized virtual router environment for Router: ${this.id}`);
  }

  public async testConnection(): Promise<RouterHealthResult> {
    if (this.simulateOffline) {
      return {
        isOnline: false,
        latencyMs: 0,
        firmwareVersion: 'Simulated OpenWrt 23.05.2 (Virtual)',
        model: 'Virtual Router Sandbox',
        activeBlockedCount: this.simulatedBlockedMacs.size,
        lastError: '[SIMULATOR] Virtual router power toggle is set to offline.',
      };
    }

    return {
      isOnline: true,
      latencyMs: 12,
      firmwareVersion: 'Simulated OpenWrt 23.05.2 (Virtual)',
      model: 'Virtual Router Sandbox',
      activeBlockedCount: this.simulatedBlockedMacs.size,
      cpuLoadPercent: 14,
      memoryUsagePercent: 32,
    };
  }

  public async discoverDevices(): Promise<DiscoveredDevice[]> {
    if (this.simulateOffline) {
      throw new Error('[SIMULATOR] Router is offline.');
    }
    // Refresh timestamps
    return this.simulatedClients.map((c) => ({
      ...c,
      lastSeen: new Date(),
    }));
  }

  public async restrictDevice(mac: string, ip?: string): Promise<RouterCommandResult> {
    const normalizedMac = mac.toUpperCase();
    console.log(`[SIMULATOR] Executing firewall drop rule: nft add element inet fw4 nightguard_mac_blocked { ${normalizedMac} }`);

    if (this.simulateOffline) {
      return {
        commandId: `sim_${Date.now()}`,
        success: false,
        executedAt: new Date().toISOString(),
        errorMessage: '[SIMULATOR] Command failed: Virtual router is offline.',
      };
    }

    if (this.simulateFailure) {
      return {
        commandId: `sim_${Date.now()}`,
        success: false,
        executedAt: new Date().toISOString(),
        errorMessage: '[SIMULATOR] Command failed: Kernel nftables lock timeout.',
      };
    }

    this.simulatedBlockedMacs.add(normalizedMac);

    return {
      commandId: `sim_${Date.now()}`,
      success: true,
      executedAt: new Date().toISOString(),
      output: {
        action: 'NFT_ELEMENT_ADDED',
        set: 'nightguard_mac_blocked',
        mac: normalizedMac,
        ip,
        verdict: 'DROP_FORWARD',
      },
    };
  }

  public async restoreDevice(mac: string, ip?: string): Promise<RouterCommandResult> {
    const normalizedMac = mac.toUpperCase();
    console.log(`[SIMULATOR] Executing firewall allow rule: nft delete element inet fw4 nightguard_mac_blocked { ${normalizedMac} }`);

    if (this.simulateOffline) {
      return {
        commandId: `sim_${Date.now()}`,
        success: false,
        executedAt: new Date().toISOString(),
        errorMessage: '[SIMULATOR] Command failed: Virtual router is offline.',
      };
    }

    this.simulatedBlockedMacs.delete(normalizedMac);

    return {
      commandId: `sim_${Date.now()}`,
      success: true,
      executedAt: new Date().toISOString(),
      output: {
        action: 'NFT_ELEMENT_DELETED',
        set: 'nightguard_mac_blocked',
        mac: normalizedMac,
        ip,
        verdict: 'RESTORE_FORWARD',
      },
    };
  }

  public async getActiveRestrictions(): Promise<string[]> {
    return Array.from(this.simulatedBlockedMacs);
  }

  public async detectCapabilities(): Promise<RouterCapabilities> {
    return {
      supportsNftables: true,
      supportsUbus: true,
      supportsPerDeviceBandwidth: true,
      supportsDnsBlocking: true,
      supportsVlan: true,
      supportsGuestIsolation: true,
      maxManagedDevices: 512,
    };
  }

  public async emergencyRestoreAll(): Promise<RouterCommandResult> {
    console.log('[SIMULATOR] Emergency flush: nft flush set inet fw4 nightguard_mac_blocked');
    this.simulatedBlockedMacs.clear();
    return {
      commandId: `sim_${Date.now()}`,
      success: true,
      executedAt: new Date().toISOString(),
      output: { action: 'NFT_SET_FLUSHED', clearedCount: 0 },
    };
  }

  public async disconnect(): Promise<void> {
    console.log(`[SIMULATOR] Virtual router ${this.id} disconnected.`);
  }
}
