'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wifi,
  Smartphone,
  CalendarClock,
  History,
  Settings,
  Shield,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Networks & Routers', href: '/networks', icon: Wifi },
  { name: 'Devices', href: '/devices', icon: Smartphone },
  { name: 'Schedules', href: '/schedules', icon: CalendarClock },
  { name: 'Activity Log', href: '/activity', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('nightguard_token');
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-graphite-900 border-r border-graphite-800 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-graphite-800 gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
          <Shield className="w-5 h-5 fill-amber-500/20" />
        </div>
        <div>
          <span className="font-semibold text-warm-50 text-base tracking-tight block">
            NightGuard
          </span>
          <span className="text-[11px] text-warm-500 block leading-none font-mono">
            DIGITAL CONTROL
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-graphite-800 text-warm-50 border border-graphite-700/80'
                  : 'text-warm-400 hover:text-warm-100 hover:bg-graphite-850'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-amber-400' : 'text-warm-500'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Firmware/Engine Info Box */}
      <div className="p-3 mx-3 mb-3 rounded-lg bg-graphite-950 border border-graphite-800 text-xs">
        <div className="flex items-center justify-between text-warm-400 mb-1">
          <span className="font-medium text-warm-300">OpenWrt fw4</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <p className="text-[11px] text-warm-500 leading-relaxed">
          Router-level nftables enforcement active. Independent of client browsers.
        </p>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-graphite-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-graphite-800 border border-graphite-700 flex items-center justify-center text-xs font-semibold text-warm-200">
            A
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-warm-200 truncate">Administrator</p>
            <p className="text-[10px] text-warm-500 truncate font-mono">admin@nightguard</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 rounded hover:bg-graphite-800 text-warm-400 hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
