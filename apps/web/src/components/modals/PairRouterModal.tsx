'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Cpu, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { RouterAdapterType } from '@nightguard/shared';

interface PairRouterModalProps {
  networkId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PairRouterModal({ networkId, isOpen, onClose, onSuccess }: PairRouterModalProps) {
  const [adapterType, setAdapterType] = useState<RouterAdapterType>(RouterAdapterType.OPENWRT);
  const [isSimulated, setIsSimulated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pairingData, setPairingData] = useState<{
    pairingToken: string;
    installCommand: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePair = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/routers/pair', {
        networkId,
        adapterType,
        isSimulated,
      });

      if (isSimulated) {
        onSuccess();
        onClose();
      } else {
        setPairingData(res.data);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate router pairing');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (pairingData?.installCommand) {
      navigator.clipboard.writeText(pairingData.installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-graphite-900 border border-graphite-700 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-fade-in text-warm-100">
        <div className="flex items-center justify-between border-b border-graphite-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-warm-50">Register / Pair Wi-Fi Router</h2>
              <p className="text-xs text-warm-400">Secure outbound router-native integration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {!pairingData ? (
          <div className="space-y-5">
            {/* Router Type Selection */}
            <div>
              <label className="text-xs font-medium text-warm-300 mb-2 block">
                Integration Architecture Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAdapterType(RouterAdapterType.OPENWRT);
                    setIsSimulated(false);
                  }}
                  className={`p-3.5 rounded-lg border text-left transition-all ${
                    !isSimulated
                      ? 'border-amber-500/50 bg-amber-500/5 text-warm-50 shadow-sm'
                      : 'border-graphite-800 bg-graphite-950 text-warm-400 hover:border-graphite-700'
                  }`}
                >
                  <div className="font-medium text-sm flex items-center gap-2 mb-1">
                    <Terminal className="w-4 h-4 text-amber-500" />
                    Physical OpenWrt
                  </div>
                  <p className="text-[11px] text-warm-500 leading-normal">
                    Compatible with OpenWrt 21.02/22.03/23.05+ (firewall4 / nftables).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdapterType(RouterAdapterType.SIMULATOR);
                    setIsSimulated(true);
                  }}
                  className={`p-3.5 rounded-lg border text-left transition-all ${
                    isSimulated
                      ? 'border-amber-500/50 bg-amber-500/5 text-warm-50 shadow-sm'
                      : 'border-graphite-800 bg-graphite-950 text-warm-400 hover:border-graphite-700'
                  }`}
                >
                  <div className="font-medium text-sm flex items-center gap-2 mb-1">
                    <Cpu className="w-4 h-4 text-amber-500" />
                    Virtual Simulator
                  </div>
                  <p className="text-[11px] text-warm-500 leading-normal">
                    Test full schedules and policy engine without physical hardware.
                  </p>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-graphite-950 border border-graphite-800 text-xs text-warm-400 space-y-2">
              <div className="flex items-center gap-2 text-warm-300 font-medium">
                <Info className="w-4 h-4 text-amber-500" />
                Zero Open Ports / No Hardware Required
              </div>
              <p className="text-[11px] text-warm-500 leading-relaxed">
                NightGuard does not require a Raspberry Pi or custom gateway. Your router connects
                outbound to our cloud using TLS. No public IP address or port forwarding needed.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-warm-300 hover:bg-graphite-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePair}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-graphite-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {loading ? 'Registering...' : isSimulated ? 'Start Virtual Gateway' : 'Generate Pairing Key'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
              Pairing token generated! Run the command below directly on your OpenWrt router terminal via SSH:
            </div>

            <div>
              <label className="text-xs font-medium text-warm-400 mb-1.5 block">
                OpenWrt Terminal Installation Command:
              </label>
              <div className="relative">
                <pre className="p-3.5 rounded-lg bg-graphite-950 border border-graphite-800 text-xs text-amber-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {pairingData.installCommand}
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

            <p className="text-[11px] text-warm-500 leading-relaxed">
              Once executed, the router will initiate a secure outbound WebSocket session and appear
              as <strong>Online</strong> on your dashboard.
            </p>

            <div className="flex justify-end pt-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-graphite-800 hover:bg-graphite-700 text-warm-100 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
