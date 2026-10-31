'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Error processing request');
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
        <h2 className="text-xl font-bold tracking-tight text-warm-100">Reset Password</h2>
        <p className="mt-1 text-xs text-warm-400">
          Enter your administrator email to receive reset instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-graphite-900 py-8 px-6 shadow-xl border border-graphite-800 rounded-xl sm:px-10 space-y-6">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-warm-300 leading-relaxed">
                If an account exists for <strong>{email}</strong>, password reset instructions have
                been dispatched.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-amber-500 hover:underline pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {error}
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-warm-300 block mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@example.com"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs focus:outline-none focus:border-amber-500/50"
                  />
                  <Mail className="w-4 h-4 text-warm-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-amber-500 text-graphite-950 font-semibold text-xs hover:bg-amber-400 transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-warm-400 hover:text-warm-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
