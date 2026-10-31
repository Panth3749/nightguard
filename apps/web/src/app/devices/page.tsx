'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  Search,
  Filter,
  Edit2,
  Lock,
  Unlock,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  DeviceTypeBadge,
  RestrictionStatusBadge,
} from '@/components/common/StatusBadge';
import { EditDeviceModal } from '@/components/modals/EditDeviceModal';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { DeviceType, RestrictionStatus } from '@nightguard/shared';

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [managedFilter, setManagedFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (managedFilter !== '') params.isManaged = managedFilter;

      const res = await api.get('/devices', params);
      setDevices(res.data?.devices || []);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, managedFilter]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleToggleManagement = async (device: any) => {
    try {
      await api.patch(`/devices/${device.id}/management`, {
        isManaged: !device.isManaged,
      });
      await fetchDevices();
    } catch (err: any) {
      alert(`Failed to update management toggle: ${err.message}`);
    }
  };

  const handleManualOverride = async (deviceId: string, action: 'restrict' | 'restore') => {
    try {
      await api.post(`/devices/${deviceId}/${action}`);
      await fetchDevices();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  return (
    <AppLayout
      title="Connected Devices"
      subtitle="Discover, classify and assign policy management for network clients"
      onRefresh={fetchDevices}
    >
      <div className="space-y-6">
        {/* Filter & Search Bar */}
        <div className="p-4 rounded-xl bg-graphite-900 border border-graphite-800 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by device name, MAC, or IP..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-xs text-warm-50 focus:outline-none focus:border-amber-500/50"
            />
            <Search className="w-4 h-4 text-warm-500 absolute left-3 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Device Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-xs text-warm-300 focus:outline-none focus:border-amber-500/50"
            >
              <option value="">All Device Types</option>
              <option value={DeviceType.SMARTPHONE}>Smartphones</option>
              <option value={DeviceType.LAPTOP}>Laptops</option>
              <option value={DeviceType.DESKTOP}>Desktops</option>
              <option value={DeviceType.TABLET}>Tablets</option>
              <option value={DeviceType.SMART_TV}>Smart TVs</option>
              <option value={DeviceType.GAMING_CONSOLE}>Gaming Consoles</option>
              <option value={DeviceType.OTHER}>Other Devices</option>
            </select>

            {/* Managed State Filter */}
            <select
              value={managedFilter}
              onChange={(e) => setManagedFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-xs text-warm-300 focus:outline-none focus:border-amber-500/50"
            >
              <option value="">All Management States</option>
              <option value="true">Managed Only (Enforced)</option>
              <option value="false">Unmanaged (Excluded)</option>
            </select>
          </div>
        </div>

        {/* Devices Table */}
        <div className="rounded-xl bg-graphite-900 border border-graphite-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-graphite-950/60 border-b border-graphite-800 text-warm-400 font-medium">
                <tr>
                  <th className="py-3 px-5">Device Friendly Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">MAC Address</th>
                  <th className="py-3 px-4">Current IP</th>
                  <th className="py-3 px-4">Management Toggle</th>
                  <th className="py-3 px-4">Enforcement State</th>
                  <th className="py-3 px-4">Last Detected</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-800/60">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-warm-500">
                      No matching devices found. Run client discovery in the Networks page.
                    </td>
                  </tr>
                ) : (
                  devices.map((device) => {
                    const isRestricted =
                      device.restrictionStatus === RestrictionStatus.RESTRICTION_ACTIVE;

                    return (
                      <tr key={device.id} className="hover:bg-graphite-850/40 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-warm-100 text-xs">
                              {device.friendlyName}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedDevice(device);
                                setEditModalOpen(true);
                              }}
                              className="text-warm-500 hover:text-amber-400 transition-colors"
                              title="Rename or edit classification"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[10px] text-warm-500 font-mono">
                            {device.hostname || 'dhcp-client'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <DeviceTypeBadge type={device.deviceType} />
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-warm-300">
                          {device.macAddress}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-warm-400">
                          {device.currentIpAddress || 'Dynamic / Released'}
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleManagement(device)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                              device.isManaged
                                ? 'bg-amber-500 text-graphite-950 hover:bg-amber-400'
                                : 'bg-graphite-800 text-warm-400 hover:bg-graphite-750'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                device.isManaged ? 'bg-graphite-950' : 'bg-warm-500'
                              }`}
                            />
                            {device.isManaged ? 'MANAGED' : 'OFF'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <RestrictionStatusBadge status={device.restrictionStatus} />
                        </td>

                        <td className="py-3.5 px-4 text-warm-500 text-[11px]">
                          {formatDate(device.lastSeenAt)}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          {device.isManaged ? (
                            isRestricted ? (
                              <button
                                onClick={() => handleManualOverride(device.id, 'restore')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-graphite-800 hover:bg-graphite-700 border border-graphite-700 text-warm-200 text-xs transition-colors"
                              >
                                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                                Restore
                              </button>
                            ) : (
                              <button
                                onClick={() => handleManualOverride(device.id, 'restrict')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs transition-colors"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                Restrict
                              </button>
                            )
                          ) : (
                            <span className="text-[11px] text-warm-600 italic">Excluded</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EditDeviceModal
        device={selectedDevice}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={fetchDevices}
      />
    </AppLayout>
  );
}
