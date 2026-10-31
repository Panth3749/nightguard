import { describe, it, expect } from 'vitest';
import { RouterSimulatorAdapter } from '../../packages/router-adapters/src/RouterSimulatorAdapter';
import { OpenWrtAdapter } from '../../packages/router-adapters/src/OpenWrtAdapter';

describe('Router Adapters & Simulation Engine', () => {
  it('correctly discovers virtual devices in simulation mode', async () => {
    const simulator = new RouterSimulatorAdapter({
      routerId: 'sim-router-1',
      networkId: 'net-1',
      model: 'Virtual Router Sandbox',
      firmwareVersion: 'v23.05.2-virtual',
      isSimulated: true,
    });

    const devices = await simulator.discoverDevices();
    expect(devices.length).toBe(5);

    const macs = devices.map((d) => d.macAddress);
    expect(macs).toContain('4A:72:9D:31:AA:01'); // Panth's Phone
    expect(macs).toContain('3C:22:FB:44:BB:02'); // Laptop
  });

  it('applies, verifies and restores nftables restrictions in simulator', async () => {
    const simulator = new RouterSimulatorAdapter({
      routerId: 'sim-router-2',
      networkId: 'net-1',
      model: 'Virtual Router Sandbox',
      firmwareVersion: 'v23.05.2-virtual',
      isSimulated: true,
    });

    const targetMac = '4A:72:9D:31:AA:01';

    // 1. Restrict
    const restrictResult = await simulator.restrictDevice(targetMac, '192.168.1.101');
    expect(restrictResult.success).toBe(true);

    const activeBlocked = await simulator.getActiveRestrictions();
    expect(activeBlocked).toContain(targetMac);

    // 2. Restore
    const restoreResult = await simulator.restoreDevice(targetMac, '192.168.1.101');
    expect(restoreResult.success).toBe(true);

    const afterRestoreBlocked = await simulator.getActiveRestrictions();
    expect(afterRestoreBlocked).not.toContain(targetMac);
  });

  it('correctly reports failure when router is offline or commands fail', async () => {
    const simulator = new RouterSimulatorAdapter({
      routerId: 'sim-router-3',
      networkId: 'net-1',
      model: 'Virtual Router Sandbox',
      firmwareVersion: 'v23.05.2-virtual',
      isSimulated: true,
    });

    simulator.simulateOffline = true;
    const health = await simulator.testConnection();
    expect(health.isOnline).toBe(false);

    const res = await simulator.restrictDevice('3C:22:FB:44:BB:02');
    expect(res.success).toBe(false);
    expect(res.errorMessage).toContain('offline');
  });

  it('OpenWrt adapter safely reports offline state when agent is not connected', async () => {
    const openwrt = new OpenWrtAdapter({
      routerId: 'real-openwrt-unconnected',
      networkId: 'net-1',
      model: 'TP-Link Archer C7',
      firmwareVersion: 'OpenWrt 23.05.2',
      isSimulated: false,
    });

    const health = await openwrt.testConnection();
    expect(health.isOnline).toBe(false);
    expect(health.lastError).toContain('Router agent is not connected');
  });
});
