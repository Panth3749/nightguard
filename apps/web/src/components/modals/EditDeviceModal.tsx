'use client';

import React, { useState, useEffect } from 'react';
import { X, Smartphone, Edit3 } from 'lucide-react';
import { api } from '@/lib/api';
import { DeviceType } from '@nightguard/shared';

interface EditDeviceModalProps {
  device: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEVICE_TYPES = [
  { value: DeviceType.SMARTPHONE, label: 'Smartphone' },
  { value: DeviceType.LAPTOP, label: 'Laptop' },
  { value: DeviceType.DESKTOP, label: 'Desktop' },
  { value: DeviceType.TABLET, label: 'Tablet' },
  { value: DeviceType.SMART_TV, label: 'Smart TV' },
  { value: DeviceType.GAMING_CONSOLE, label: 'Gaming Console' },
  { value: DeviceType.OTHER, label: 'Other Device' },
];

export function EditDeviceModal({ device, isOpen, onClose, onSuccess }: EditDeviceModalProps) {
  const [friendlyName, setFriendlyName] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>(DeviceType.OTHER);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device && isOpen) {
      setFriendlyName(device.friendlyName || '');
      setDeviceType(device.deviceType || DeviceType.OTHER);
      setNotes(device.notes || '');
    }
  }, [device, isOpen]);

  if (!isOpen || !device) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await api.patch(`/devices/${device.id}`, {
        friendlyName,
        deviceType,
        notes,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-graphite-900 border border-graphite-700 rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in text-warm-100">
        <div className="flex items-center justify-between border-b border-graphite-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-warm-50">Edit Device Identity</h2>
              <p className="text-xs text-warm-400">Rename or change device classification</p>
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
          <div>
            <label className="text-xs font-medium text-warm-300 mb-1.5 block">Friendly Name</label>
            <input
              type="text"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs focus:outline-none focus:border-amber-500/50"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-warm-300 mb-1.5 block">Device Classification</label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as DeviceType)}
              className="w-full px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs focus:outline-none focus:border-amber-500/50"
            >
              {DEVICE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-lg bg-graphite-950 border border-graphite-800 text-xs font-mono space-y-1">
            <div className="text-warm-400 flex justify-between">
              <span>MAC Address:</span>
              <span className="text-warm-200">{device.macAddress}</span>
            </div>
            <div className="text-warm-400 flex justify-between">
              <span>Current IP:</span>
              <span className="text-warm-200">{device.currentIpAddress || 'Dynamic / Unassigned'}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-warm-300 mb-1.5 block">Notes / Owner (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 rounded-lg bg-graphite-950 border border-graphite-800 text-warm-50 text-xs focus:outline-none focus:border-amber-500/50"
              placeholder="e.g. Living room study desk"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-graphite-800">
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
