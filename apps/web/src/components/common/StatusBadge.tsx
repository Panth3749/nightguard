'use client';

import React from 'react';
import {
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  Tv,
  Gamepad2,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { DeviceType, RestrictionStatus, RouterConnectionStatus } from '@nightguard/shared';

export function DeviceTypeBadge({ type }: { type: string }) {
  const getIcon = () => {
    switch (type) {
      case DeviceType.SMARTPHONE:
        return <Smartphone className="w-3.5 h-3.5" />;
      case DeviceType.LAPTOP:
        return <Laptop className="w-3.5 h-3.5" />;
      case DeviceType.DESKTOP:
        return <Monitor className="w-3.5 h-3.5" />;
      case DeviceType.TABLET:
        return <Tablet className="w-3.5 h-3.5" />;
      case DeviceType.SMART_TV:
        return <Tv className="w-3.5 h-3.5" />;
      case DeviceType.GAMING_CONSOLE:
        return <Gamepad2 className="w-3.5 h-3.5" />;
      default:
        return <HardDrive className="w-3.5 h-3.5" />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case DeviceType.SMARTPHONE:
        return 'Phone';
      case DeviceType.LAPTOP:
        return 'Laptop';
      case DeviceType.DESKTOP:
        return 'Desktop';
      case DeviceType.TABLET:
        return 'Tablet';
      case DeviceType.SMART_TV:
        return 'Smart TV';
      case DeviceType.GAMING_CONSOLE:
        return 'Console';
      default:
        return 'Device';
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-graphite-800 text-warm-300 border border-graphite-700">
      {getIcon()}
      {getLabel()}
    </span>
  );
}

export function RestrictionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case RestrictionStatus.RESTRICTION_ACTIVE:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Restricted
        </span>
      );
    case RestrictionStatus.SCHEDULED:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Clock className="w-3 h-3 text-emerald-400" />
          Scheduled
        </span>
      );
    case RestrictionStatus.PENDING:
    case RestrictionStatus.RESTORATION_PENDING:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          <Clock className="w-3 h-3 text-yellow-400 animate-spin" />
          Pending
        </span>
      );
    case RestrictionStatus.ROUTER_OFFLINE:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <Wifi className="w-3 h-3 text-rose-400" />
          Router Offline
        </span>
      );
    case RestrictionStatus.FAILED:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          Failed
        </span>
      );
    case RestrictionStatus.NOT_MANAGED:
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-graphite-800 text-warm-400 border border-graphite-700">
          Unmanaged
        </span>
      );
  }
}

export function RouterStatusBadge({
  status,
  isSimulated = false,
}: {
  status: string;
  isSimulated?: boolean;
}) {
  if (status === RouterConnectionStatus.ONLINE) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {isSimulated ? 'Online (Virtual Simulator)' : 'Online (OpenWrt)'}
      </span>
    );
  }

  if (status === RouterConnectionStatus.PAIRING) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
        <Clock className="w-3 h-3 text-purple-400" />
        Awaiting Router Pairing
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
      Router Offline
    </span>
  );
}
