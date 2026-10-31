'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  Plus,
  Clock,
  Moon,
  Sun,
  Edit2,
  Trash2,
  CheckCircle2,
  Smartphone,
  AlertCircle,
  Pause,
  Play,
  Layers,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScheduleModal } from '@/components/modals/ScheduleModal';
import { api } from '@/lib/api';
import { formatTime12h, crossesMidnight } from '@/lib/utils';
import { DayOfWeek } from '@nightguard/shared';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    try {
      const [schedRes, netRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/networks'),
      ]);
      setSchedules(schedRes.data?.schedules || []);
      setNetworks(netRes.data?.networks || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleToggle = async (scheduleId: string) => {
    try {
      await api.post(`/schedules/${scheduleId}/toggle`);
      await fetchSchedules();
    } catch (err: any) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule? Associated devices will no longer be restricted by it.')) {
      return;
    }
    try {
      await api.delete(`/schedules/${scheduleId}`);
      await fetchSchedules();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const defaultNetworkId = networks[0]?.id || '';

  return (
    <AppLayout
      title="Access Schedules"
      subtitle="Automated bedtime and focus schedules enforced at the router firewall"
      onRefresh={fetchSchedules}
    >
      <div className="space-y-6">
        {/* Header Action */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-warm-100">Configured Schedules</h2>
            <p className="text-xs text-warm-400">
              Policies run independently of browser tabs via the NightGuard backend scheduler
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSchedule(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 text-graphite-950 font-semibold text-xs hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Schedule
          </button>
        </div>

        {/* Schedules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schedules.length === 0 ? (
            <div className="col-span-2 p-12 text-center rounded-xl bg-graphite-900 border border-graphite-800">
              <CalendarClock className="w-10 h-10 text-warm-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-warm-300">No schedules configured yet</p>
              <p className="text-xs text-warm-500 mt-1">
                Create a schedule to automatically restrict internet access at bedtime.
              </p>
            </div>
          ) : (
            schedules.map((schedule) => {
              const isMidnightCrossing = crossesMidnight(schedule.startTime, schedule.endTime);
              let daysList: string[] = [];
              try {
                daysList = JSON.parse(schedule.daysOfWeek);
              } catch {
                daysList = [];
              }

              const assignedDevices = schedule.scheduleDevices || [];

              return (
                <div
                  key={schedule.id}
                  className={`p-6 rounded-xl bg-graphite-900 border transition-all ${
                    schedule.isEnabled
                      ? 'border-graphite-800 shadow-sm'
                      : 'border-graphite-800/60 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-warm-100">{schedule.name}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            schedule.isEnabled
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-graphite-800 text-warm-500'
                          }`}
                        >
                          {schedule.isEnabled ? 'ACTIVE' : 'PAUSED'}
                        </span>
                      </div>
                      <p className="text-xs text-warm-500 mt-0.5">Timezone: {schedule.timezone}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggle(schedule.id)}
                        className="p-1.5 rounded-lg bg-graphite-800 text-warm-400 hover:text-warm-100 transition-colors"
                        title={schedule.isEnabled ? 'Pause Schedule' : 'Resume Schedule'}
                      >
                        {schedule.isEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingSchedule(schedule);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-graphite-800 text-warm-400 hover:text-warm-100 transition-colors"
                        title="Edit Schedule"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="p-1.5 rounded-lg bg-graphite-800 text-warm-500 hover:text-rose-400 transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Time Window Display */}
                  <div className="p-3.5 rounded-lg bg-graphite-950 border border-graphite-800 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="text-[10px] text-warm-500 block">Restriction Starts</span>
                          <span className="font-semibold text-warm-100 text-sm">
                            {formatTime12h(schedule.startTime)}
                          </span>
                        </div>
                      </div>

                      <div className="text-warm-600 font-mono">→</div>

                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="text-[10px] text-warm-500 block">Access Restored</span>
                          <span className="font-semibold text-warm-100 text-sm">
                            {formatTime12h(schedule.endTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isMidnightCrossing && (
                      <div className="mt-2.5 pt-2.5 border-t border-graphite-850 flex items-center gap-1.5 text-[11px] text-amber-400/90">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Crosses midnight (ends the following calendar day)</span>
                      </div>
                    )}
                  </div>

                  {/* Active Days Pills */}
                  <div className="mb-4">
                    <span className="text-[11px] text-warm-500 block mb-1.5 font-medium">Active Weekdays</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { key: DayOfWeek.MONDAY, label: 'Mon' },
                        { key: DayOfWeek.TUESDAY, label: 'Tue' },
                        { key: DayOfWeek.WEDNESDAY, label: 'Wed' },
                        { key: DayOfWeek.THURSDAY, label: 'Thu' },
                        { key: DayOfWeek.FRIDAY, label: 'Fri' },
                        { key: DayOfWeek.SATURDAY, label: 'Sat' },
                        { key: DayOfWeek.SUNDAY, label: 'Sun' },
                      ].map((day) => {
                        const active = daysList.includes(day.key);
                        return (
                          <span
                            key={day.key}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              active
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-graphite-950 text-warm-600 border border-graphite-850'
                            }`}
                          >
                            {day.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assigned Devices */}
                  <div>
                    <span className="text-[11px] text-warm-500 block mb-1.5 font-medium">
                      Assigned Managed Devices ({assignedDevices.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedDevices.length === 0 ? (
                        <span className="text-xs text-warm-600 italic">No devices currently assigned.</span>
                      ) : (
                        assignedDevices.map((item: any) => (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-graphite-800 border border-graphite-700 text-warm-200 text-xs"
                          >
                            <Smartphone className="w-3 h-3 text-warm-400" />
                            {item.device?.friendlyName || 'Device'}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ScheduleModal
        networkId={defaultNetworkId}
        schedule={editingSchedule}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchSchedules}
      />
    </AppLayout>
  );
}
