'use client';

import React, { useState, useEffect } from 'react';
import { X, CalendarClock, Moon, Sun, Check, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { DayOfWeek } from '@nightguard/shared';
import { crossesMidnight, formatTime12h } from '@/lib/utils';

interface ScheduleModalProps {
  networkId: string;
  schedule?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ALL_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: DayOfWeek.MONDAY, label: 'Mon' },
  { key: DayOfWeek.TUESDAY, label: 'Tue' },
  { key: DayOfWeek.WEDNESDAY, label: 'Wed' },
  { key: DayOfWeek.THURSDAY, label: 'Thu' },
  { key: DayOfWeek.FRIDAY, label: 'Fri' },
  { key: DayOfWeek.SATURDAY, label: 'Sat' },
  { key: DayOfWeek.SUNDAY, label: 'Sun' },
];

export function ScheduleModal({ networkId, schedule, isOpen, onClose, onSuccess }: ScheduleModalProps) {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('07:00');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY,
  ]);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch devices on this network
      api.get('/devices', { networkId }).then((res) => {
        setAvailableDevices(res.data?.devices || []);
      });

      if (schedule) {
        setName(schedule.name);
        setStartTime(schedule.startTime);
        setEndTime(schedule.endTime);
        try {
          setSelectedDays(JSON.parse(schedule.daysOfWeek));
        } catch {
          setSelectedDays(ALL_DAYS.map((d) => d.key));
        }
        const devIds = schedule.scheduleDevices?.map((sd: any) => sd.device?.id || sd.deviceId) || [];
        setSelectedDeviceIds(devIds);
      } else {
        setName('Sleep Time Schedule');
        setStartTime('22:00');
        setEndTime('07:00');
      }
    }
  }, [isOpen, schedule, networkId]);

  if (!isOpen) return null;

  const isCrossingMidnight = crossesMidnight(startTime, endTime);

  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleDevice = (devId: string) => {
    if (selectedDeviceIds.includes(devId)) {
      setSelectedDeviceIds(selectedDeviceIds.filter((id) => id !== devId));
    } else {
      setSelectedDeviceIds([...selectedDeviceIds, devId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this schedule.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        networkId,
        name,
        startTime,
        endTime,
        daysOfWeek: selectedDays,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        deviceIds: selectedDeviceIds,
      };

      if (schedule?.id) {
        await api.patch(`/schedules/${schedule.id}`, payload);
      } else {
        await api.post('/schedules', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-graphite-900 border border-graphite-700 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-fade-in text-warm-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-graphite-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-warm-50">
                {schedule ? 'Edit Access Schedule' : 'Create Access Restriction Schedule'}
              </h2>
              <p className="text-xs text-warm-400">Automated router firewall enforcement</p>
            </div>
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Schedule Name */}
          <div>
            <label className="text-xs font-medium text-warm-300 mb-1.5 block">Schedule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Night Sleep Hours, Focus Time"
              className="w-full px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs focus:outline-none focus:border-amber-500/50"
              required
            />
          </div>

          {/* Time Window */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-warm-300 mb-1.5 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-amber-500" />
                Restriction Starts (Block)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                required
              />
              <span className="text-[10px] text-warm-500 mt-1 block">
                {formatTime12h(startTime)}
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-warm-300 mb-1.5 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                Restriction Ends (Restore)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                required
              />
              <span className="text-[10px] text-warm-500 mt-1 block">
                {formatTime12h(endTime)}
              </span>
            </div>
          </div>

          {/* Midnight Crossing Alert */}
          {isCrossingMidnight && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Schedule crosses midnight ({formatTime12h(startTime)} until {formatTime12h(endTime)} next morning). Handled automatically.
              </span>
            </div>
          )}

          {/* Days of Week */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-warm-300 block">Active Days</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDays(ALL_DAYS.map((d) => d.key))}
                  className="text-[11px] text-amber-500 hover:underline"
                >
                  All Days
                </button>
                <span className="text-warm-600">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDays([
                      DayOfWeek.MONDAY,
                      DayOfWeek.TUESDAY,
                      DayOfWeek.WEDNESDAY,
                      DayOfWeek.THURSDAY,
                      DayOfWeek.FRIDAY,
                    ])
                  }
                  className="text-[11px] text-amber-500 hover:underline"
                >
                  Weekdays
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {ALL_DAYS.map((d) => {
                const isSelected = selectedDays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    className={`py-2 rounded text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-graphite-950 font-semibold'
                        : 'bg-graphite-950 border border-graphite-800 text-warm-400 hover:bg-graphite-800'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Device Selection */}
          <div>
            <label className="text-xs font-medium text-warm-300 mb-2 block">
              Assigned Devices ({selectedDeviceIds.length} selected)
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-graphite-950 border border-graphite-800">
              {availableDevices.length === 0 ? (
                <p className="text-xs text-warm-500 py-3 text-center">No devices found on this network.</p>
              ) : (
                availableDevices.map((dev) => {
                  const isChecked = selectedDeviceIds.includes(dev.id);
                  return (
                    <div
                      key={dev.id}
                      onClick={() => toggleDevice(dev.id)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        isChecked ? 'bg-graphite-850 border border-amber-500/30' : 'hover:bg-graphite-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked
                              ? 'bg-amber-500 border-amber-500 text-graphite-950'
                              : 'border-graphite-700'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs text-warm-200 truncate">{dev.friendlyName}</span>
                      </div>
                      <span className="text-[10px] text-warm-500 font-mono">{dev.macAddress}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-graphite-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-warm-300 hover:bg-graphite-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-graphite-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
