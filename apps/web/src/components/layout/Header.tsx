'use client';

import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, Radio } from 'lucide-react';
import { api } from '@/lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  isConnected?: boolean;
  onRefresh?: () => void;
  networkId?: string;
}

export function Header({
  title,
  subtitle,
  isConnected = true,
  onRefresh,
  networkId,
}: HeaderProps) {
  const [isFlushing, setIsFlushing] = useState(false);
  const [overrideNotice, setOverrideNotice] = useState<string | null>(null);

  const handleEmergencyOverride = async () => {
    if (!confirm('EMERGENCY OVERRIDE:\nThis will immediately remove all firewall restrictions from your router and restore internet access to all devices. Proceed?')) {
      return;
    }

    try {
      setIsFlushing(true);
      // Trigger emergency restore
      const routers = await api.get('/routers');
      const targetRouter = routers.data?.routers?.[0];

      if (targetRouter) {
        await api.post(`/routers/${targetRouter.id}/emergency-restore`);
        setOverrideNotice('Emergency override applied: All devices unblocked.');
        setTimeout(() => setOverrideNotice(null), 5000);
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      alert(`Emergency override failed: ${err.message}`);
    } finally {
      setIsFlushing(false);
    }
  };

  return (
    <header className="h-16 border-b border-graphite-800 bg-graphite-900/60 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-semibold text-warm-50 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-warm-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {overrideNotice && (
          <div className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs animate-fade-in">
            {overrideNotice}
          </div>
        )}

        {/* Real-time WebSocket connection state */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${
            isConnected
              ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/5 text-rose-400 border-rose-500/20'
          }`}
        >
          <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
          <span>{isConnected ? 'LIVE WS' : 'RECONNECTING'}</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="p-2 rounded-lg bg-graphite-800 border border-graphite-700 hover:bg-graphite-750 text-warm-300 hover:text-warm-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Emergency Override Button */}
        <button
          onClick={handleEmergencyOverride}
          disabled={isFlushing}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/10 text-rose-400 hover:bg-rose-600/20 border border-rose-500/30 transition-colors disabled:opacity-50"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{isFlushing ? 'Restoring All...' : 'Emergency Override'}</span>
        </button>
      </div>
    </header>
  );
}
