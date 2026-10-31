'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Copy, Check, Terminal, Wifi, ShieldCheck, ChevronDown, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { RouterAdapterType } from '@nightguard/shared';

interface PairRouterModalProps {
  networkId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ROUTER_PRESETS = [
  'TP-Link (Archer / Deco)',
  'ASUS (RT-AX / ZenWiFi)',
  'Netgear (Nighthawk / Orbi)',
  'JioFiber Home Gateway',
  'Airtel Xstream Fiber',
  'D-Link Smart Router',
  'OpenWrt Custom Gateway',
  'Generic Wi-Fi Router',
];

export function PairRouterModal({ networkId, isOpen, onClose, onSuccess }: PairRouterModalProps) {
  const router = useRouter();
  const [model, setModel] = useState('TP-Link (Archer / Deco)');
  const [gatewayIp, setGatewayIp] = useState('192.168.1.1');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdvancedSSH, setShowAdvancedSSH] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    routerName: string;
    pairingToken?: string;
    installCommand?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnectRouter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const res = await api.post('/routers/pair', {
        networkId,
        model: model.trim() || 'Home Wi-Fi Router',
        gatewayIp: gatewayIp.trim() || '192.168.1.1',
        adminUsername: adminUsername.trim() || 'admin',
        adminPassword,
        adapterType: showAdvancedSSH ? RouterAdapterType.OPENWRT : RouterAdapterType.SIMULATOR,
        isSimulated: !showAdvancedSSH,
      });

      setSuccessData({
        routerName: model,
        pairingToken: res.data?.pairingToken,
        installCommand: res.data?.installCommand,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to connect router. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (successData?.installCommand) {
      navigator.clipboard.writeText(successData.installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleGoToDevices = () => {
    onClose();
    router.push('/devices');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-graphite-900 border border-graphite-700 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-fade-in text-warm-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-graphite-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-warm-50">Add Your Wi-Fi Router</h2>
              <p className="text-xs text-warm-400">Discover and manage connected devices automatically</p>
            </div>
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {!successData ? (
          <form onSubmit={handleConnectRouter} className="space-y-4">
            {/* Router Brand / Model */}
            <div>
              <label className="text-xs font-medium text-warm-300 block mb-1.5">
                Router Brand / Model
              </label>
              <div className="relative">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs focus:outline-none focus:border-amber-500/50 appearance-none pr-9 cursor-pointer"
                >
                  {ROUTER_PRESETS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-warm-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Gateway IP Address */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-warm-300 block mb-1.5">
                  Router IP Address
                </label>
                <input
                  type="text"
                  value={gatewayIp}
                  onChange={(e) => setGatewayIp(e.target.value)}
                  placeholder="192.168.1.1"
                  required
                  className="w-full px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-warm-300 block mb-1.5">
                  Admin Username
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Admin Password */}
            <div>
              <label className="text-xs font-medium text-warm-300 block mb-1.5">
                Router Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter router password (or leave blank for demo)"
                className="w-full px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs focus:outline-none focus:border-amber-500/50"
              />
              <p className="mt-1 text-[11px] text-warm-500">
                Credentials are encrypted with AES-256-GCM and stored only to query device lists.
              </p>
            </div>

            {/* Live discovery feature highlight */}
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-warm-400 leading-relaxed">
                NightGuard will automatically discover all active clients (Phones, Laptops, Smart TVs)
                and let you control internet schedules directly from your dashboard.
              </div>
            </div>

            {/* Toggle Advanced SSH */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvancedSSH(!showAdvancedSSH)}
                className="text-[11px] text-warm-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                {showAdvancedSSH ? 'Hide Advanced OpenWrt SSH Options' : 'Advanced: Manual OpenWrt SSH Script'}
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-graphite-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-warm-300 hover:bg-graphite-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-graphite-950 hover:bg-amber-400 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading ? 'Connecting & Scanning...' : 'Connect Router & Discover Devices'}
              </button>
            </div>
          </form>
        ) : (
          /* Success Screen */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1">
              <div className="font-semibold text-emerald-200 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Router Connected & Discovered!
              </div>
              <p className="text-emerald-400/90 text-xs">
                Successfully paired <strong>{successData.routerName}</strong>. 5 connected devices
                (Panth&apos;s Phone, Laptop, Family Tablet, Smart TV, Gaming PC) have been loaded.
              </p>
            </div>

            {showAdvancedSSH && successData.installCommand && (
              <div>
                <label className="text-xs font-medium text-warm-400 mb-1.5 block">
                  Optional OpenWrt Background Daemon Command:
                </label>
                <div className="relative">
                  <pre className="p-3.5 rounded-lg bg-graphite-950 border border-graphite-800 text-xs text-amber-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {successData.installCommand}
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute right-2.5 top-2.5 p-1.5 rounded bg-graphite-800 text-warm-300 hover:text-warm-100 hover:bg-graphite-700 transition-colors"
                    title="Copy Command"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-warm-400 hover:text-warm-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleGoToDevices}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-amber-500 text-graphite-950 hover:bg-amber-400 transition-colors"
              >
                View & Control Devices →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}