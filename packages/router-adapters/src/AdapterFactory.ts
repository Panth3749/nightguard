import { RouterAdapter, RouterConfig } from './RouterAdapter';
import { OpenWrtAdapter } from './OpenWrtAdapter';
import { RouterSimulatorAdapter } from './RouterSimulatorAdapter';
import { RouterAdapterType } from '@nightguard/shared';

export class AdapterFactory {
  private static adapterInstances = new Map<string, RouterAdapter>();

  public static getAdapter(config: RouterConfig & { adapterType: RouterAdapterType }): RouterAdapter {
    const cacheKey = `${config.routerId}:${config.adapterType}:${config.isSimulated}`;

    if (this.adapterInstances.has(cacheKey)) {
      return this.adapterInstances.get(cacheKey)!;
    }

    let adapter: RouterAdapter;

    if (config.isSimulated || config.adapterType === RouterAdapterType.SIMULATOR) {
      adapter = new RouterSimulatorAdapter(config);
    } else if (config.adapterType === RouterAdapterType.OPENWRT) {
      adapter = new OpenWrtAdapter(config);
    } else {
      // Fallback or generic linux
      adapter = new OpenWrtAdapter(config);
    }

    this.adapterInstances.set(cacheKey, adapter);
    return adapter;
  }

  public static clearCache(): void {
    this.adapterInstances.clear();
  }
}
