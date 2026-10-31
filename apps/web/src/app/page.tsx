'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Wifi,
  Clock,
  Terminal,
  CheckCircle2,
  Lock,
  ArrowRight,
  Cpu,
  Layers,
  AlertCircle,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-graphite-950 text-warm-50 selection:bg-amber-500/20 selection:text-amber-300">
      {/* Navigation */}
      <header className="border-b border-graphite-800 bg-graphite-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Shield className="w-5 h-5 fill-amber-500/20" />
            </div>
            <div>
              <span className="font-semibold text-warm-50 text-base tracking-tight block">
                NightGuard
              </span>
              <span className="text-[10px] text-warm-500 block leading-none font-mono">
                DIGITAL WELLBEING PLATFORM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-medium text-warm-300 hover:text-warm-50 px-3 py-1.5 rounded transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold bg-amber-500 text-graphite-950 hover:bg-amber-400 px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Hardware-Free Wi-Fi Access Control & Sleep Scheduling
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-warm-50 mb-6 leading-tight">
          Automate Wi-Fi Schedules <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600">
            Directly from Your Existing Router
          </span>
        </h1>

        <p className="text-base md:text-lg text-warm-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          NightGuard restricts internet access for selected devices on a scheduled bedtime or study
          routine. Powered by OpenWrt firewall integration—without buying extra dongles, hubs, or
          Raspberry Pis.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-amber-500 text-graphite-950 font-semibold text-sm hover:bg-amber-400 transition-colors shadow-md"
          >
            Get Started Now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-graphite-900 border border-graphite-700 text-warm-200 font-medium text-sm hover:bg-graphite-850 hover:text-warm-50 transition-colors"
          >
            Launch Interactive Demo
          </Link>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-graphite-800">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-warm-50 mb-2">Engineered for Reality</h2>
          <p className="text-xs text-warm-400 max-w-xl mx-auto">
            Traditional web apps cannot reach private 192.168.1.1 IPs or pretend to control hardware.
            NightGuard solves this with modern outbound integration.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-graphite-900 border border-graphite-800">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-warm-100 mb-2">
              Outbound Router Agent
            </h3>
            <p className="text-xs text-warm-400 leading-relaxed">
              Your compatible router initiates an outbound encrypted TLS WebSocket connection. No
              open ports, no insecure port forwarding, and no public IP exposure required.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-graphite-900 border border-graphite-800">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-warm-100 mb-2">
              Kernel nftables Rules
            </h3>
            <p className="text-xs text-warm-400 leading-relaxed">
              Restrictions are applied directly in OpenWrt firewall4 using atomic nftables sets. Local
              network access remains available while internet forward traffic is blocked.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-graphite-900 border border-graphite-800">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-warm-100 mb-2">
              Independent Cloud Scheduler
            </h3>
            <p className="text-xs text-warm-400 leading-relaxed">
              Schedules run autonomously on our resilient backend. NightGuard executes midnight-crossing
              windows, retries dropped connections, and recovers missed events after restarts.
            </p>
          </div>
        </div>
      </section>

      {/* Transparent Technical Limitations */}
      <section className="py-12 px-6 max-w-4xl mx-auto mb-16">
        <div className="p-6 rounded-xl bg-graphite-900 border border-graphite-800 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-sm">
            <AlertCircle className="w-5 h-5" />
            Scope and Boundary Transparency
          </div>
          <p className="text-xs text-warm-400 leading-relaxed">
            NightGuard provides <strong>router-level internet access restrictions</strong>. It blocks
            Wi-Fi forward traffic for managed devices during designated hours. It does not claim to
            physically lock mobile screens or prevent switching to cellular SIM data without future
            native OS management profiles (Apple Family Controls / Android Device Owner).
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-graphite-800 py-8 px-6 text-center text-xs text-warm-500">
        <p>© 2026 NightGuard. Wi-Fi-based Digital Wellbeing Platform. Deployed on Render.</p>
      </footer>
    </div>
  );
}
