'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wifi,
  Plus,
  Terminal,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RouterStatusBadge } from '@/components/common/StatusBadge';
import { PairRouterModal } from '@/components/modals/PairRouterModal';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function NetworksPage() {
  const [networks, setNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairModalOpen, setPairModalOpen] = useState(false);
  const [activeNetworkId, setActiveNetworkId] = useState<string>('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [newNetName, setNewNetName] = useState('');
  const [newNetSsid, setNewNetSsid] = useState('');
  const [showAddNetwork, setShowAddNetwork] = useState(false);

  const fetchNetworks = useCallback(async () => {
    try {
      const res = await api.get('/networks');
      setNetworks(res.data?.networks || []);
      if (res.data?.networks?.length > 0 && !activeNetworkId) {
        setActiveNetworkId(res.data.networks[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch networks:', err);
    } finally {
      setLoading(false);
    }
  }, [activeNetworkId]);

  useEffect(() => {
    fetchNetworks();
  }, [fetchNetworks]);

  const handleCreateNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/networks', { name: newNetName, ssid: newNetSsid });
      setNewNetName('');
      setNewNetSsid('');
      setShowAddNetwork(false);
      await fetchNetworks();
    } catch (err: any) {
      alert(`Error creating network: ${err.message}`);
    }
  };

  const handleDeleteNetwork = async (id: string) => {
    if (!confirm('Are you sure you want to delete this network? All router pairings and device configurations will be removed.')) {
      return;
    }
    try {
      await api.delete(`/networks/${id}`);
      await fetchNetworks();
    } catch (err: any) {
      alert(`Failed to delete network: ${err.message}`);
    }
  };

  const handleSyncRouter = async (routerId: string) => {
    try {
      setSyncingId(routerId);
      const res = await api.post(`/routers/${routerId}/sync`);
      alert(`Sync completed! Discovered ${res.data?.syncedCount || 0} active clients.`);
      await fetchNetworks();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <AppLayout
      title="Networks & Gateways"
      subtitle="Register Wi-Fi networks and pair compatible OpenWrt routers"
      onRefresh={fetchNetworks}
    >
      <div className="space-y-6">
        {/* Top actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-warm-100">Registered Wi-Fi Networks</h2>
            <p className="text-xs text-warm-400">
              Manage router-level digital control environments
            </p>
          </div>
          <button
            onClick={() => setShowAddNetwork(!showAddNetwork)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 text-graphite-950 font-semibold text-xs hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Wi-Fi Network
          </button>
        </div>

        {/* Add Network Inline Form */}
        {showAddNetwork && (
          <form
            onSubmit={handleCreateNetwork}
            className="p-5 rounded-xl bg-graphite-900 border border-graphite-700 animate-fade-in space-y-4"
          >
            <h3 className="text-xs font-semibold text-warm-200 uppercase tracking-wider">
              Register New Network
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-warm-400 block mb-1">Network Friendly Name</label>
                <input
                  type="text"
                  value={newNetName}
                  onChange={(e) => setNewNetName(e.target.value)}
                  placeholder="e.g. Home Living Room"
                  className="w-full px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-xs text-warm-50 focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-warm-400 block mb-1">Wi-Fi SSID Name</label>
                <input
                  type="text"
                  value={newNetSsid}
                  onChange={(e) => setNewNetSsid(e.target.value)}
                  placeholder="e.g. NightGuard_5G"
                  className="w-full px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-xs text-warm-50 focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddNetwork(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-warm-400 hover:text-warm-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-graphite-950 hover:bg-amber-400"
              >
                Save Network
              </button>
            </div>
          </form>
        )}

        {/* Networks List */}
        <div className="space-y-4">
          {networks.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-graphite-900 border border-graphite-800">
              <Wifi className="w-10 h-10 text-warm-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-warm-300">No Wi-Fi networks registered yet</p>
              <p className="text-xs text-warm-500 mt-1">
                Add your home Wi-Fi network to start discovering and controlling devices.
              </p>
            </div>
          ) : (
            networks.map((net) => {
              const router = net.routers?.[0];
              return (
                <div
                  key={net.id}
                  className="p-6 rounded-xl bg-graphite-900 border border-graphite-800 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-graphite-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                        <Wifi className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-warm-100 flex items-center gap-2">
                          {net.name}
                          {net.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-graphite-800 text-warm-400 font-mono">
                              DEFAULT
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-warm-500 font-mono">SSID: {net.ssid}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!router && (
                        <button
                          onClick={() => {
                            setActiveNetworkId(net.id);
                            setPairModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-graphite-950 hover:bg-amber-400 transition-colors"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          Pair Router
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNetwork(net.id)}
                        className="p-1.5 rounded-lg text-warm-500 hover:text-rose-400 hover:bg-graphite-800 transition-colors"
                        title="Delete Network"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Router status details */}
                  {router ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-graphite-950 border border-graphite-800 text-xs">
                      <div>
                        <span className="text-warm-500 text-[11px] block">Router Gateway</span>
                        <span className="font-medium text-warm-200 block truncate">{router.model}</span>
                        <span className="text-[10px] text-warm-500 font-mono">{router.firmwareVersion}</span>
                      </div>

                      <div>
                        <span className="text-warm-500 text-[11px] block">Connection Health</span>
                        <div className="mt-0.5">
                          <RouterStatusBadge
                            status={router.connectionStatus}
                            isSimulated={router.isSimulated}
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-warm-500 text-[11px] block">Last Synchronization</span>
                        <span className="text-warm-300 font-mono text-[11px] block mt-0.5">
                          {formatDate(router.lastHeartbeatAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleSyncRouter(router.id)}
                          disabled={syncingId === router.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-graphite-800 hover:bg-graphite-750 border border-graphite-700 text-warm-200 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${syncingId === router.id ? 'animate-spin' : ''}`}
                          />
                          <span>{syncingId === router.id ? 'Syncing...' : 'Discover Devices'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-graphite-950 border border-dashed border-graphite-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-warm-400">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>No router paired with this network. Internet restriction cannot be enforced.</span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveNetworkId(net.id);
                          setPairModalOpen(true);
                        }}
                        className="text-amber-500 hover:underline font-medium"
                      >
                        Pair Router Now
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <PairRouterModal
        networkId={activeNetworkId}
        isOpen={pairModalOpen}
        onClose={() => setPairModalOpen(false)}
        onSuccess={fetchNetworks}
      />
    </AppLayout>
  );
}
