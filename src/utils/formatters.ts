import type { ReadingStatus } from '../data/types';

/** Format elapsed seconds as `HH:MM:SS`. */
export function formatDurationHms(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}

export const READING_STATUS_LABELS: Record<ReadingStatus, { emoji: string; label: string }> = {
  want: { emoji: '🔖', label: 'Muốn đọc' },
  reading: { emoji: '📖', label: 'Đang đọc' },
  read: { emoji: '✅', label: 'Đã đọc' },
};

/** Format ISO timestamp concisely in Vietnamese locale. */
export function formatDateTimeVi(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
