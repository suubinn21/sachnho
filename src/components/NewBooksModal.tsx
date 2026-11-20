import { useState } from 'react';
import { BookOpen, Sparkles, X } from 'lucide-react';
import type { BookMeta } from '../data/types';

interface NewBooksModalProps {
  newBooks: BookMeta[];
  onReadNow: (book: BookMeta) => void;
  onGoToBook: (book: BookMeta) => void;
  onDismiss: (suppressSession: boolean) => void;
}

export function NewBooksModal({
  newBooks,
  onReadNow,
  onGoToBook,
  onDismiss,
}: NewBooksModalProps) {
  const [suppressSession, setSuppressSession] = useState(true);
  const displayList = newBooks.slice(0, 5);

  if (displayList.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sách mới thêm"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-3xl border border-[var(--border-soft)] bg-[var(--sheet)] p-6 text-[var(--ink)] shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--cobalt)] px-2.5 py-0.5 font-sans-ui text-[10px] font-semibold uppercase tracking-wider text-white">
              <Sparkles className="h-3 w-3" />
              Mới thêm
            </span>
            <h2 className="font-serif-book mt-1.5 text-2xl font-medium">
              Sách mới thêm vào kệ
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(suppressSession)}
            aria-label="Bỏ qua thông báo sách mới"
            className="cursor-pointer rounded-full p-1.5 text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {displayList.map((book) => (
            <li
              key={book.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--paper)] px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onGoToBook(book)}
                  className="cursor-pointer truncate text-left font-serif-book text-base font-medium text-[var(--ink)] hover:text-[var(--cobalt)]"
                >
                  {book.title}
                </button>
                <p className="truncate font-sans-ui text-xs text-[var(--muted)]">
                  {book.author} · {book.categoryGroup}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onReadNow(book)}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-[var(--cobalt)] px-3 py-1.5 font-sans-ui text-xs font-medium text-white transition hover:opacity-90"
              >
                <BookOpen className="h-3 w-3" />
                Đọc ngay
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 font-sans-ui text-xs text-[var(--muted)]">
            <input
              type="checkbox"
              checked={suppressSession}
              onChange={(e) => setSuppressSession(e.target.checked)}
            />
            <span>Không hiện lại trong phiên này</span>
          </label>
          <button
            type="button"
            onClick={() => onDismiss(suppressSession)}
            className="cursor-pointer rounded-full border border-[var(--border-soft)] px-4 py-1.5 font-sans-ui text-xs font-medium text-[var(--ink)] hover:border-[var(--cobalt)]"
          >
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );
}
