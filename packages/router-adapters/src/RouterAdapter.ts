import {
  DiscoveredDevice,
  RouterCapabilities,
  RouterHealthResult,
  RouterCommandResult,
} from '@nightguard/shared';

export interface RouterConfig {
  routerId: string;
  networkId: string;
  model: string;
  firmwareVersion: string;
  isSimulated: boolean;
  credentials?: string;
  sharedSecret?: string;
}

export interface RouterAdapter {
  readonly id: string;
  readonly isSimulated: boolean;

  /**
   * Initializes the adapter and sets up any listeners or connection pools.
   */
  initialize(): Promise<void>;

  /**
   * Verifies connectivity to the router and fetches its current health state.
   */
  testConnection(): Promise<RouterHealthResult>;

  /**
   * Discovers all devices currently associated or having active DHCP/ARP entries on the router.
   */
  discoverDevices(): Promise<DiscoveredDevice[]>;

  /**
   * Restricts internet forwarding for a specific MAC address via router firewall (nftables).
   */
  restrictDevice(mac: string, ip?: string): Promise<RouterCommandResult>;

  /**
   * Restores internet forwarding for a specific MAC address via router firewall (nftables).
   */
  restoreDevice(mac: string, ip?: string): Promise<RouterCommandResult>;

  /**
   * Returns list of currently blocked MAC addresses directly verified from router firewall table.
   */
  getActiveRestrictions(): Promise<string[]>;

  /**
   * Detects capabilities of the router hardware/firmware (nftables, ubus, etc.)
   */
  detectCapabilities(): Promise<RouterCapabilities>;

  /**
   * Emergency override: removes all restrictions and clears the NightGuard firewall set.
   */
  emergencyRestoreAll(): Promise<RouterCommandResult>;

  /**
   * Closes any open sessions or sockets.
   */
  disconnect(): Promise<void>;
}
