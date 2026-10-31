'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.token) {
        localStorage.setItem('nightguard_token', res.data.token);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/login', {
        email: 'admin@nightguard.local',
        password: 'AdminSecurePassword123!',
      });
      if (res.data?.token) {
        localStorage.setItem('nightguard_token', res.data.token);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-graphite-950 flex flex-col justify-center py-12 px-6 lg:px-8 text-warm-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Shield className="w-6 h-6 fill-amber-500/20" />
          </div>
          <span className="font-semibold text-xl tracking-tight text-warm-50">NightGuard</span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-warm-100">
          Sign In to Administrator Console
        </h2>
        <p className="mt-1 text-xs text-warm-400">Manage your connected routers, schedules and devices</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-graphite-900 py-8 px-6 shadow-xl border border-graphite-800 rounded-xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-warm-300 block mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@nightguard.local"
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs focus:outline-none focus:border-amber-500/50"
                />
                <Mail className="w-4 h-4 text-warm-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-warm-300 block">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-amber-500 hover:text-amber-400"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs focus:outline-none focus:border-amber-500/50"
                />
                <Lock className="w-4 h-4 text-warm-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-500 text-graphite-950 font-semibold text-xs hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Button */}
          <div className="pt-4 border-t border-graphite-800">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-graphite-800 hover:bg-graphite-750 border border-graphite-700 text-warm-200 text-xs font-medium transition-colors"
            >
              One-Click Quick Sign In (Demo Admin)
            </button>
          </div>

          <div className="text-center text-xs text-warm-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-amber-500 hover:underline">
              Create an administrator account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
