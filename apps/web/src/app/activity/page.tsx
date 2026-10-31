'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Lock,
  Unlock,
  AlertTriangle,
  Radio,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { AuditAction } from '@nightguard/shared';

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const fetchActivity = useCallback(async () => {
    try {
      const params: any = { page, limit: 30 };
      if (actionFilter) params.action = actionFilter;

      const res = await api.get('/activity', params);
      setLogs(res.data?.logs || []);
      setPagination(res.data?.pagination || null);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case AuditAction.RESTRICTION_APPLIED:
        return <Lock className="w-4 h-4 text-amber-400" />;
      case AuditAction.RESTORATION_APPLIED:
        return <Unlock className="w-4 h-4 text-emerald-400" />;
      case AuditAction.EMERGENCY_OVERRIDE:
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case AuditAction.COMMAND_FAILED:
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case AuditAction.ROUTER_STATUS_CHANGED:
        return <Radio className="w-4 h-4 text-purple-400" />;
      default:
        return <Clock className="w-4 h-4 text-warm-400" />;
    }
  };

  return (
    <AppLayout
      title="Activity & Audit Logs"
      subtitle="Complete chronological audit trail of policy events and router commands"
      onRefresh={fetchActivity}
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="p-4 rounded-xl bg-graphite-900 border border-graphite-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-warm-400" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-xs text-warm-300 focus:outline-none focus:border-amber-500/50"
            >
              <option value="">All Audit Events</option>
              <option value={AuditAction.RESTRICTION_APPLIED}>Restriction Applied (Blocked)</option>
              <option value={AuditAction.RESTORATION_APPLIED}>Access Restored</option>
              <option value={AuditAction.MANUAL_OVERRIDE}>Manual Overrides</option>
              <option value={AuditAction.EMERGENCY_OVERRIDE}>Emergency Overrides</option>
              <option value={AuditAction.MANAGEMENT_TOGGLED}>Management Toggled</option>
              <option value={AuditAction.COMMAND_FAILED}>Failed Router Commands</option>
            </select>
          </div>

          <span className="text-xs text-warm-500 font-mono">
            {pagination ? `${pagination.total} total log entries` : ''}
          </span>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-xl bg-graphite-900 border border-graphite-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-graphite-950/60 border-b border-graphite-800 text-warm-400 font-medium">
                <tr>
                  <th className="py-3 px-5">Event</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-warm-500">
                      No activity records found matching filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    let parsedDetails: any = null;
                    try {
                      if (log.details) parsedDetails = JSON.parse(log.details);
                    } catch {}

                    return (
                      <tr key={log.id} className="hover:bg-graphite-850/40 transition-colors">
                        <td className="py-3 px-5">
                          <div className="w-7 h-7 rounded-lg bg-graphite-800 border border-graphite-700 flex items-center justify-center">
                            {getActionIcon(log.action)}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-warm-200">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-warm-400 font-medium">
                          {log.entityType}
                        </td>
                        <td className="py-3 px-4 text-warm-300 font-mono text-[11px] max-w-md truncate">
                          {parsedDetails ? (
                            <span>
                              {parsedDetails.friendlyName && `${parsedDetails.friendlyName} `}
                              {parsedDetails.mac && `(${parsedDetails.mac}) `}
                              {parsedDetails.reason || parsedDetails.message || JSON.stringify(parsedDetails)}
                            </span>
                          ) : (
                            log.details || '—'
                          )}
                        </td>
                        <td className="py-3 px-5 text-right font-mono text-warm-500 text-[11px]">
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-graphite-800 flex items-center justify-between text-xs">
              <span className="text-warm-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded bg-graphite-800 text-warm-300 hover:bg-graphite-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded bg-graphite-800 text-warm-300 hover:bg-graphite-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
