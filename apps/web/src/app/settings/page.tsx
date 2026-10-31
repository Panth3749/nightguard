'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Clock,
  Terminal,
  Shield,
  CheckCircle2,
  Copy,
  Check,
  Server,
  Key,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/auth/me'), api.get('/health')])
      .then(([meRes, healthRes]) => {
        setUser(meRes.data?.user || null);
        setHealth(healthRes);
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const openWrtManualCommand = `opkg update && opkg install nftables curl\ncurl -sSL https://api.nightguard.render.com/agent/install.sh | sh`;

  const copyScript = () => {
    navigator.clipboard.writeText(openWrtManualCommand);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <AppLayout
      title="Platform Settings"
      subtitle="Configure profile preferences, security policies and OpenWrt router credentials"
    >
      <div className="space-y-6 max-w-4xl">
        {/* Profile Card */}
        <div className="p-6 rounded-xl bg-graphite-900 border border-graphite-800 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-graphite-800">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-warm-100">Administrator Profile</h3>
              <p className="text-xs text-warm-400">Personal details and timezone</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-warm-400 block mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={user?.name || 'Administrator'}
                className="w-full px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-200"
              />
            </div>
            <div>
              <label className="text-warm-400 block mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || 'admin@nightguard.local'}
                className="w-full px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-200"
              />
            </div>
            <div>
              <label className="text-warm-400 block mb-1">Default Schedule Timezone</label>
              <input
                type="text"
                disabled
                value={user?.timezone || 'UTC'}
                className="w-full px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-200 font-mono"
              />
            </div>
            <div>
              <label className="text-warm-400 block mb-1">Account Role</label>
              <div className="px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-amber-400 font-mono font-semibold">
                {user?.role || 'ADMIN'}
              </div>
            </div>
          </div>
        </div>

        {/* Router Software Reference Card */}
        <div className="p-6 rounded-xl bg-graphite-900 border border-graphite-800 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-graphite-800">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-warm-100">OpenWrt Integration Reference</h3>
              <p className="text-xs text-warm-400">
                Lightweight, outbound-only shell agent and nftables firewall integration
              </p>
            </div>
          </div>

          <p className="text-xs text-warm-400 leading-relaxed">
            The NightGuard OpenWrt agent communicates outbound over TLS WebSocket. It adds MAC
            addresses to the <code>inet fw4 nightguard_mac_blocked</code> set in the router&apos;s
            Linux kernel forward chain.
          </p>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-warm-400">Manual Prerequisites Command:</label>
              <button
                onClick={copyScript}
                className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-3.5 rounded-lg bg-graphite-950 border border-graphite-800 text-xs font-mono text-warm-300 overflow-x-auto whitespace-pre-wrap">
              {openWrtManualCommand}
            </pre>
          </div>
        </div>

        {/* Backend Diagnostics Card */}
        <div className="p-6 rounded-xl bg-graphite-900 border border-graphite-800 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-graphite-800">
            <div className="p-2 rounded-lg bg-graphite-800 text-warm-300">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-warm-100">System Diagnostics & Render Health</h3>
              <p className="text-xs text-warm-400">Cloud API and database service health indicators</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800">
              <span className="text-warm-500 block text-[10px]">API SERVICE</span>
              <span className="text-emerald-400 font-semibold">{health?.status || 'UP'}</span>
            </div>
            <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800">
              <span className="text-warm-500 block text-[10px]">DATABASE</span>
              <span className="text-emerald-400 font-semibold">{health?.database || 'CONNECTED'}</span>
            </div>
            <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800">
              <span className="text-warm-500 block text-[10px]">SCHEDULER ENGINE</span>
              <span className="text-amber-400 font-semibold">ACTIVE (30s)</span>
            </div>
            <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800">
              <span className="text-warm-500 block text-[10px]">UPTIME</span>
              <span className="text-warm-200 font-semibold">{health?.uptimeSeconds || 0}s</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
