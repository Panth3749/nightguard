'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useRealtimeSubscription } from '@/lib/websocket';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export function AppLayout({ children, title, subtitle, onRefresh }: AppLayoutProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Subscribe to real-time events and forward to page onRefresh
  const { isConnected } = useRealtimeSubscription(() => {
    if (onRefresh) onRefresh();
  });

  useEffect(() => {
    const token = localStorage.getItem('nightguard_token');
    // For demo convenience, allow viewing or redirect to login if missing
    if (!token && window.location.pathname !== '/login' && window.location.pathname !== '/') {
      // In standalone demo, we can automatically set a demo token if needed or redirect
      // router.push('/login');
    }
    setIsAuthorized(true);
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-graphite-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-graphite-950 text-warm-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header
          title={title}
          subtitle={subtitle}
          isConnected={isConnected}
          onRefresh={onRefresh}
        />
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
