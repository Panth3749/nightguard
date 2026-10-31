import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMacAddress(mac: string): string {
  return (mac || '').toUpperCase();
}

export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return 'Never';
  const d = new Date(dateString);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

export function crossesMidnight(start: string, end: string): boolean {
  if (!start || !end) return false;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  return h1 * 60 + m1 > h2 * 60 + m2;
}
