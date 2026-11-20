import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import type { BookMeta, UserBookState } from '../data/types';
import { BookSpine3D } from './BookVisuals';

interface Bookshelf3DProps {
  books: BookMeta[];
  activeBookId: string | null;
  bookStates: Record<string, UserBookState>;
  onFocusBook: (bookId: string) => void;
  onOpenDetail: (book: BookMeta) => void;
}

export function Bookshelf3D({
  books,
  activeBookId,
  bookStates,
  onFocusBook,
  onOpenDetail,
}: Bookshelf3DProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const activeIndex = Math.max(
    0,
    books.findIndex((b) => b.id === activeBookId),
  );
  const activeBook = books[activeIndex] ?? null;

  // Smoothly keep the focused spine centered whenever selection or filtered book count changes
  useEffect(() => {
    if (!activeBook) return;
    const rafId = window.requestAnimationFrame(() => {
      const track = trackRef.current;
      const node = itemRefs.current[activeBook.id];
      if (!track || !node) return;
      const targetLeft =
        node.offsetLeft - track.clientWidth / 2 + node.clientWidth / 2;
      track.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth',
      });
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [activeBook, books.length]);

  const handleStep = (delta: number) => {
    if (books.length === 0) return;
    const nextIdx = (activeIndex + delta + books.length) % books.length;
    onFocusBook(books[nextIdx].id);
  };

  if (books.length === 0) {
    return (
      <section
        aria-label="Kệ sách"
        className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
      >
        <div className="max-w-md rounded-2xl border border-[var(--border-soft)] bg-[var(--glass-strong)] p-7 shadow-lg backdrop-blur-md">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-[var(--cobalt)]" />
          <h2 className="font-serif-book text-xl font-medium text-[var(--ink)]">
            Không có sách phù hợp trên kệ
          </h2>
          <p className="font-sans-ui mt-2 text-sm text-[var(--muted)]">
            Thử điều chỉnh lại bộ lọc hoặc đặt tệp sách <code>.txt</code> vào thư mục{' '}
            <code>src/data/raw/</code> để hiển thị trên kệ.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Kệ sách"
      className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-hidden px-2 py-2 sm:px-4"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleStep(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleStep(1);
        }
      }}
    >
      {/* Horizontal 3D Bookshelf Track */}
      <div className="relative w-full max-w-6xl">
        <div
          ref={trackRef}
          onWheel={(e) => {
            if (!trackRef.current) return;
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              trackRef.current.scrollLeft += e.deltaY;
            }
          }}
          className="no-scrollbar flex items-end gap-2 overflow-x-auto px-[20vw] pt-8 pb-3 sm:gap-2.5 sm:px-[32vw]"
        >
          {books.map((book) => {
            const isActive = activeBook?.id === book.id;
            return (
              <div
                key={book.id}
                ref={(el) => {
                  itemRefs.current[book.id] = el;
                }}
                className="shrink-0"
              >
                <BookSpine3D
                  book={book}
                  isActive={isActive}
                  bookState={bookStates[book.id]}
                  onSelectOrOpen={() => {
                    // FR-02 Fix: active center book opens detail modal; side books focus into center
                    if (isActive) {
                      onOpenDetail(book);
                    } else {
                      onFocusBook(book.id);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Crafted walnut library shelf ledge */}
        <div className="relative mx-auto w-[95%]">
          <div className="wood-shelf-top h-4 w-full rounded-t-[6px] border-t border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" />
          <div className="wood-shelf-fascia h-2.5 w-full rounded-b-lg shadow-[0_14px_26px_-6px_rgba(0,0,0,0.45)]" />
        </div>
      </div>

      {/* Active Book Controls & Caption */}
      {activeBook && (
        <div className="mt-3 flex max-w-2xl flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              aria-label="Sách trước"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--glass)] text-[var(--ink)] shadow-sm backdrop-blur-md transition hover:border-[var(--cobalt)] hover:text-[var(--cobalt)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onOpenDetail(activeBook)}
              aria-label={`Xem chi tiết sách ${activeBook.title}`}
              className="group cursor-pointer rounded-2xl border border-[var(--border-soft)] bg-[var(--glass)] px-5 py-2 shadow-sm backdrop-blur-md transition hover:border-[var(--cobalt)]"
            >
              <h2 className="font-serif-book text-xl font-medium leading-snug text-[var(--ink)] group-hover:text-[var(--cobalt)] sm:text-2xl">
                {activeBook.title}
              </h2>
              <p className="font-sans-ui mt-0.5 text-xs text-[var(--muted)] sm:text-[13px]">
                <span className="font-medium text-[var(--ink)]">{activeBook.author}</span>
                <span> · {activeBook.categoryGroup}</span>
                <span> · {activeBook.format}</span>
                {activeBook.year ? <span> · {activeBook.year}</span> : null}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleStep(1)}
              aria-label="Sách sau"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--glass)] text-[var(--ink)] shadow-sm backdrop-blur-md transition hover:border-[var(--cobalt)] hover:text-[var(--cobalt)]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-1.5 rounded-full bg-[var(--glass)] px-3 py-0.5 font-sans-ui text-[11px] text-[var(--muted)] backdrop-blur-sm">
            Nhấp lại vào cuốn sách đang chọn để xem chi tiết &amp; đọc · ({activeIndex + 1}/{books.length})
          </p>
        </div>
      )}
    </section>
  );
}
