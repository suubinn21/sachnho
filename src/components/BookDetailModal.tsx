import { useEffect } from 'react';
import { BookOpen, Star, X } from 'lucide-react';
import type { BookMeta, ReadingStatus, UserBookState } from '../data/types';
import { READING_STATUS_LABELS } from '../utils/formatters';
import { BookCoverArt } from './BookVisuals';

interface BookDetailModalProps {
  book: BookMeta;
  bookState?: UserBookState;
  onClose: () => void;
  onUpdateState: (bookId: string, patch: Partial<UserBookState>) => void;
  onStartReading: (book: BookMeta) => void;
}

const STATUS_OPTIONS: ReadingStatus[] = ['want', 'reading', 'read'];

export function BookDetailModal({
  book,
  bookState,
  onClose,
  onUpdateState,
  onStartReading,
}: BookDetailModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const currentStatus = bookState?.status;
  const currentRating = bookState?.rating ?? 0;
  const resumePage = bookState?.lastPage && bookState.lastPage > 1 ? bookState.lastPage : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết sách ${book.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-circle-reveal relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[var(--border-soft)] bg-[var(--sheet)] p-5 text-[var(--ink)] shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chi tiết sách"
          className="absolute top-4 right-4 inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--paper)] px-3 py-1 font-sans-ui text-xs font-semibold tracking-wider text-[var(--ink)] transition hover:border-[var(--cobalt)] hover:text-[var(--cobalt)]"
        >
          <X className="h-3.5 w-3.5" />
          ĐÓNG
        </button>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.25fr_0.85fr] md:items-center">
          {/* Left Column: Metadata, Status, Stars, Excerpt, CTA */}
          <div>
            <p className="font-sans-ui text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cobalt)]">
              {book.author} / {book.genre}
            </p>
            <h2 className="font-serif-book mt-1.5 text-2xl font-medium leading-tight text-[var(--ink)] sm:text-3xl">
              {book.title}
            </h2>
            <p className="font-sans-ui mt-1.5 text-xs text-[var(--muted)] sm:text-sm">
              {book.categoryGroup} · {book.format} · ~{book.estimatedPages} trang
              {book.year ? ` · ${book.year}` : ''}
            </p>

            {/* Reading Status */}
            <div className="mt-5">
              <span className="font-sans-ui mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Trạng thái đọc
              </span>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => {
                  const info = READING_STATUS_LABELS[status];
                  const isActive = currentStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        onUpdateState(book.id, {
                          status: isActive ? undefined : status,
                        })
                      }
                      className={`cursor-pointer rounded-full px-3 py-1.5 font-sans-ui text-xs font-medium transition ${
                        isActive
                          ? 'bg-[var(--cobalt)] text-white shadow-sm'
                          : 'border border-[var(--border-soft)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--cobalt)]'
                      }`}
                    >
                      {info.emoji} {info.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Star Rating */}
            <div className="mt-4">
              <span className="font-sans-ui mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Chấm sao
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {([1, 2, 3, 4, 5] as const).map((star) => {
                  const filled = star <= currentRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      aria-label={`${star} sao`}
                      onClick={() => onUpdateState(book.id, { rating: star })}
                      className="cursor-pointer rounded-lg p-1 transition hover:scale-110"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          filled
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-[var(--muted)]'
                        }`}
                      />
                    </button>
                  );
                })}
                {currentRating > 0 && (
                  <button
                    type="button"
                    onClick={() => onUpdateState(book.id, { rating: undefined })}
                    className="ml-2 cursor-pointer rounded-full border border-[var(--border-soft)] px-2.5 py-0.5 font-sans-ui text-[11px] text-[var(--muted)] transition hover:text-[var(--ink)]"
                  >
                    Bỏ sao
                  </button>
                )}
              </div>
            </div>

            {/* Excerpt / Synopsis */}
            <div className="mt-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] p-4">
              <span className="font-sans-ui mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Trích đoạn mở đầu
              </span>
              <p className="font-serif-book text-sm leading-relaxed text-[var(--ink)] sm:text-[15px]">
                {book.synopsis || 'Sách sẵn sàng để mở đọc trực tiếp trên trình đọc hai trang.'}
              </p>
              <p className="font-serif-book mt-2 text-right text-xs italic text-[var(--muted)]">
                — {book.author}
              </p>
            </div>

            {/* Primary CTA */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onStartReading(book)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--cobalt)] px-6 py-2.5 font-sans-ui text-sm font-semibold text-white shadow-md transition hover:opacity-90"
              >
                <BookOpen className="h-4 w-4" />
                {resumePage ? `Đọc tiếp (Trang ${resumePage})` : 'Đọc ngay'}
              </button>
            </div>
          </div>

          {/* Right Column: Large Book Cover */}
          <div className="mx-auto w-48 sm:w-56 md:w-full md:max-w-[270px]">
            <BookCoverArt book={book} size="lg" className="aspect-[2/3] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
