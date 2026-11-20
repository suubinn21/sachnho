import { useRef, useState } from 'react';
import { Download, Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import type {
  BackupPayload,
  BookmarkItem,
  HighlightItem,
  ReadingHistoryItem,
  UserBookState,
  UserPreferences,
} from '../data/types';
import {
  buildBackupPayload,
  mergeBackupData,
  parseAndValidateBackup,
} from '../storage/backup';

interface BackupModalProps {
  bookStates: Record<string, UserBookState>;
  bookmarks: Record<string, BookmarkItem[]>;
  highlights: Record<string, HighlightItem[]>;
  readingHistory: ReadingHistoryItem[];
  preferences: UserPreferences;
  onApplyRestore: (
    next: Omit<BackupPayload, 'app' | 'schemaVersion' | 'exportedAt'>,
  ) => void;
  onClose: () => void;
}

export function BackupModal({
  bookStates,
  bookmarks,
  highlights,
  readingHistory,
  preferences,
  onApplyRestore,
  onClose,
}: BackupModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [feedback, setFeedback] = useState<{
    kind: 'ok' | 'err';
    text: string;
  } | null>(null);

  const totalBookmarks = Object.values(bookmarks).reduce((acc, list) => acc + list.length, 0);
  const totalHighlights = Object.values(highlights).reduce((acc, list) => acc + list.length, 0);
  const trackedBooks = Object.keys(bookStates).length;

  const handleExport = () => {
    const payload = buildBackupPayload({
      bookStates,
      bookmarks,
      highlights,
      readingHistory,
      preferences,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `sach-cua-dang-backup-${dateStamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback({ kind: 'ok', text: 'Đã xuất tệp sao lưu JSON thành công.' });
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const incoming = parseAndValidateBackup(text);
      if (importMode === 'overwrite') {
        onApplyRestore({
          bookStates: incoming.bookStates,
          bookmarks: incoming.bookmarks,
          highlights: incoming.highlights,
          readingHistory: incoming.readingHistory,
          preferences: incoming.preferences,
        });
      } else {
        const merged = mergeBackupData(
          { bookStates, bookmarks, highlights, readingHistory, preferences },
          incoming,
        );
        onApplyRestore(merged);
      }
      setFeedback({
        kind: 'ok',
        text:
          importMode === 'overwrite'
            ? 'Đã khôi phục (ghi đè) dữ liệu từ bản sao lưu.'
            : 'Đã gộp dữ liệu sao lưu mới nhất thành công.',
      });
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Không thể đọc tệp sao lưu.',
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sao lưu và khôi phục dữ liệu cá nhân"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border-soft)] bg-[var(--sheet)] p-6 text-[var(--ink)] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp thoại sao lưu"
          className="absolute top-4 right-4 cursor-pointer rounded-full p-1.5 text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="font-serif-book text-2xl font-medium">
          Sao lưu &amp; Khôi phục dữ liệu
        </h2>
        <p className="font-sans-ui mt-1 text-xs leading-relaxed text-[var(--muted)]">
          Toàn bộ tiến độ đọc, chấm sao, bookmark và highlight đang lưu cục bộ trên trình duyệt này. Xuất file JSON để lưu trữ hoặc chuyển sang máy khác.
        </p>

        {/* Current Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--paper)] p-3 text-center">
          <div>
            <p className="font-serif-book text-xl font-medium text-[var(--cobalt)]">
              {trackedBooks}
            </p>
            <p className="font-sans-ui text-[11px] text-[var(--muted)]">Sách đã đánh dấu</p>
          </div>
          <div>
            <p className="font-serif-book text-xl font-medium text-[var(--cobalt)]">
              {totalBookmarks}
            </p>
            <p className="font-sans-ui text-[11px] text-[var(--muted)]">Dấu trang</p>
          </div>
          <div>
            <p className="font-serif-book text-xl font-medium text-[var(--cobalt)]">
              {totalHighlights}
            </p>
            <p className="font-sans-ui text-[11px] text-[var(--muted)]">Đoạn tô màu</p>
          </div>
        </div>

        {/* Export Section */}
        <div className="mt-5">
          <button
            type="button"
            onClick={handleExport}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--cobalt)] px-4 py-2.5 font-sans-ui text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Xuất file sao lưu (.json)
          </button>
        </div>

        {/* Import Section */}
        <div className="mt-4 rounded-xl border border-[var(--border-soft)] bg-[var(--paper)] p-4">
          <p className="font-sans-ui text-xs font-semibold text-[var(--ink)]">
            Nhập lại từ file sao lưu (.json)
          </p>
          <div className="mt-2 flex gap-4 font-sans-ui text-xs">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
              />
              <span>Gộp thông minh (giữ mới nhất)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'overwrite'}
                onChange={() => setImportMode('overwrite')}
              />
              <span>Ghi đè toàn bộ</span>
            </label>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--sheet)] px-4 py-2 font-sans-ui text-xs font-medium text-[var(--ink)] transition hover:border-[var(--cobalt)]"
          >
            <Upload className="h-3.5 w-3.5" />
            Chọn tệp .json để khôi phục
          </button>
        </div>

        {feedback && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 font-sans-ui text-xs ${
              feedback.kind === 'ok'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/15 text-red-700 dark:text-red-300'
            }`}
          >
            {feedback.kind === 'ok' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
