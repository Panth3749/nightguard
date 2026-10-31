'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wifi,
  Smartphone,
  Shield,
  CalendarClock,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  DeviceTypeBadge,
  RestrictionStatusBadge,
  RouterStatusBadge,
} from '@/components/common/StatusBadge';
import { api } from '@/lib/api';
import { formatTime12h, formatDate } from '@/lib/utils';
import { RestrictionStatus } from '@nightguard/shared';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [routers, setRouters] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, devRes, routerRes, schedRes] = await Promise.all([
        api.get('/system/stats'),
        api.get('/devices'),
        api.get('/routers'),
        api.get('/schedules'),
      ]);

      setStats(statsRes.data);
      setDevices(devRes.data?.devices || []);
      setRouters(routerRes.data?.routers || []);
      setSchedules(schedRes.data?.schedules || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSyncDevices = async () => {
    if (routers.length === 0) return;
    try {
      setSyncing(true);
      await api.post(`/routers/${routers[0].id}/sync`);
      await fetchData();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleManagement = async (deviceId: string, current: boolean) => {
    try {
      await api.patch(`/devices/${deviceId}/management`, { isManaged: !current });
      await fetchData();
    } catch (err: any) {
      alert(`Failed to toggle management: ${err.message}`);
    }
  };

  const handleManualOverride = async (deviceId: string, action: 'restrict' | 'restore') => {
    try {
      await api.post(`/devices/${deviceId}/${action}`);
      await fetchData();
    } catch (err: any) {
      alert(`Override failed: ${err.message}`);
    }
  };

  const managedDevices = devices.filter((d) => d.isManaged);
  const restrictedDevices = devices.filter(
    (d) => d.restrictionStatus === RestrictionStatus.RESTRICTION_ACTIVE
  );
  const primaryRouter = routers[0];

  return (
    <AppLayout
      title="System Overview"
      subtitle="Real-time Wi-Fi access management and policy enforcement"
      onRefresh={fetchData}
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Router Status */}
          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-warm-400">Router Health</span>
              <div className="p-2 rounded-lg bg-graphite-800 text-warm-300">
                <Wifi className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="mb-1">
                {primaryRouter ? (
                  <RouterStatusBadge
                    status={primaryRouter.connectionStatus}
                    isSimulated={primaryRouter.isSimulated}
                  />
                ) : (
                  <span className="text-xs text-warm-500">No Router Paired</span>
                )}
              </div>
              <p className="text-[11px] text-warm-500 truncate">
                {primaryRouter ? primaryRouter.model : 'Pair an OpenWrt router'}
              </p>
            </div>
          </div>

          {/* Card 2: Managed Devices */}
          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-warm-400">Managed Devices</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-warm-50">{managedDevices.length}</span>
                <span className="text-xs text-warm-500 font-mono">/ {devices.length} total</span>
              </div>
              <p className="text-[11px] text-warm-500">Devices following schedule rules</p>
            </div>
          </div>

          {/* Card 3: Restricted Now */}
          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-warm-400">Active Restrictions</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-400">
                  {restrictedDevices.length}
                </span>
                <span className="text-xs text-warm-500">blocked</span>
              </div>
              <p className="text-[11px] text-warm-500">Currently blocked by firewall4</p>
            </div>
          </div>

          {/* Card 4: Active Schedules */}
          <div className="p-5 rounded-xl bg-graphite-900 border border-graphite-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-warm-400">Active Schedules</span>
              <div className="p-2 rounded-lg bg-graphite-800 text-warm-300">
                <CalendarClock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-warm-50">
                  {schedules.filter((s) => s.isEnabled).length}
                </span>
                <span className="text-xs text-warm-500 font-mono">/ {schedules.length} enabled</span>
              </div>
              <p className="text-[11px] text-warm-500">Automated nightly policies</p>
            </div>
          </div>
        </div>

        {/* Action Banner / Quick Sync */}
        <div className="p-4 rounded-xl bg-graphite-900 border border-graphite-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-warm-200">
                Firewall Policy Engine Active
              </p>
              <p className="text-[11px] text-warm-500">
                Outbound ubus/nftables synchronization running every 30s.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleSyncDevices}
              disabled={syncing || !primaryRouter}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-graphite-800 border border-graphite-700 text-warm-200 hover:text-warm-50 hover:bg-graphite-750 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Querying Router...' : 'Discover & Sync Clients'}</span>
            </button>

            <Link
              href="/devices"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-graphite-950 hover:bg-amber-400 transition-colors"
            >
              <span>Manage Devices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Managed Devices Table */}
        <div className="rounded-xl bg-graphite-900 border border-graphite-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-graphite-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-warm-100">Managed Network Devices</h2>
              <p className="text-xs text-warm-500">Devices subject to automated sleep restrictions</p>
            </div>
            <Link href="/devices" className="text-xs text-amber-500 hover:underline">
              View all {devices.length} devices
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-graphite-950/60 border-b border-graphite-800 text-warm-400 font-medium">
                <tr>
                  <th className="py-3 px-5">Device</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">MAC & IP Address</th>
                  <th className="py-3 px-4">Management</th>
                  <th className="py-3 px-4">Enforcement State</th>
                  <th className="py-3 px-5 text-right">Quick Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-800/60">
                {managedDevices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-warm-500">
                      No devices currently managed. Enable management in the Devices tab.
                    </td>
                  </tr>
                ) : (
                  managedDevices.map((d) => {
                    const isRestricted = d.restrictionStatus === RestrictionStatus.RESTRICTION_ACTIVE;
                    return (
                      <tr key={d.id} className="hover:bg-graphite-850/40 transition-colors">
                        <td className="py-3.5 px-5">
                          <p className="font-medium text-warm-100 text-xs">{d.friendlyName}</p>
                          <p className="text-[10px] text-warm-500 font-mono">{d.hostname || 'Unknown hostname'}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <DeviceTypeBadge type={d.deviceType} />
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-warm-300">
                          <div>{d.macAddress}</div>
                          <div className="text-[10px] text-warm-500">{d.currentIpAddress || 'No IP'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleManagement(d.id, d.isManaged)}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            MANAGED
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <RestrictionStatusBadge status={d.restrictionStatus} />
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {isRestricted ? (
                            <button
                              onClick={() => handleManualOverride(d.id, 'restore')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-graphite-800 hover:bg-graphite-700 border border-graphite-700 text-warm-200 text-xs transition-colors"
                            >
                              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                              Restore Now
                            </button>
                          ) : (
                            <button
                              onClick={() => handleManualOverride(d.id, 'restrict')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs transition-colors"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Restrict Now
                            </button>
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

        {/* Active Schedules Preview */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-graphite-900 border border-graphite-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-warm-100">Configured Schedules</h3>
              <Link href="/schedules" className="text-xs text-amber-500 hover:underline">
                Manage
              </Link>
            </div>
            <div className="space-y-3">
              {schedules.length === 0 ? (
                <p className="text-xs text-warm-500 py-4 text-center">No schedules created yet.</p>
              ) : (
                schedules.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-medium text-warm-200">{s.name}</p>
                      <p className="text-[11px] text-warm-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {formatTime12h(s.startTime)} – {formatTime12h(s.endTime)}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        s.isEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-graphite-800 text-warm-500'
                      }`}
                    >
                      {s.isEnabled ? 'Enabled' : 'Paused'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl bg-graphite-900 border border-graphite-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-warm-100">Recent System Activity</h3>
              <Link href="/activity" className="text-xs text-amber-500 hover:underline">
                Full Log
              </Link>
            </div>
            <div className="space-y-3">
              {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
                <p className="text-xs text-warm-500 py-4 text-center">No recent activity logged.</p>
              ) : (
                stats.recentActivity.slice(0, 4).map((log: any) => (
                  <div key={log.id} className="text-xs border-b border-graphite-800/80 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-warm-400 mb-0.5">
                      <span className="font-mono text-[11px] text-amber-500/90">{log.action}</span>
                      <span className="text-[10px] text-warm-500">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-warm-300 truncate">
                      {log.details ? JSON.parse(log.details).friendlyName || JSON.parse(log.details).message || 'Event processed' : 'System event'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
