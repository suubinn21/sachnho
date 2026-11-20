import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  Highlighter,
  List,
  Loader2,
  Moon,
  Music,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { loadBookContent } from '../data/adapter';
import type {
  BookContent,
  BookMeta,
  BookmarkItem,
  HighlightColorKey,
  HighlightItem,
  ThemeMode,
} from '../data/types';
import { formatDurationHms } from '../utils/formatters';
import {
  formatRemainingTime,
  paginateBookContent,
  type ReaderPage,
} from '../utils/pagination';
import { BookCoverArt } from './BookVisuals';

const ZOOM_LEVELS = [85, 100, 115, 130, 150, 175, 200, 250] as const;

const HIGHLIGHT_STYLES: Record<
  HighlightColorKey,
  { label: string; markClass: string; swatchClass: string }
> = {
  amber: {
    label: 'Vàng ấm',
    markClass: 'bg-amber-300/65 text-inherit rounded px-0.5 dark:bg-amber-400/35',
    swatchClass: 'bg-amber-300',
  },
  mint: {
    label: 'Xanh lá',
    markClass: 'bg-emerald-300/55 text-inherit rounded px-0.5 dark:bg-emerald-400/35',
    swatchClass: 'bg-emerald-300',
  },
  sky: {
    label: 'Xanh trời',
    markClass: 'bg-sky-300/55 text-inherit rounded px-0.5 dark:bg-sky-400/35',
    swatchClass: 'bg-sky-300',
  },
  rose: {
    label: 'Hồng phấn',
    markClass: 'bg-rose-300/55 text-inherit rounded px-0.5 dark:bg-rose-400/35',
    swatchClass: 'bg-rose-300',
  },
};

interface BookReaderProps {
  book: BookMeta;
  initialPage: number;
  zoom: number;
  theme: ThemeMode;
  sessionSeconds: number;
  isMusicPlaying: boolean;
  bookmarks: BookmarkItem[];
  highlights: HighlightItem[];
  onChangeZoom: (nextZoom: number) => void;
  onToggleTheme: () => void;
  onToggleMusic: () => void;
  onProgressChange: (bookId: string, pageNumber: number) => void;
  onToggleBookmark: (bookId: string, pageNumber: number, chapterTitle?: string) => void;
  onRemoveBookmark: (bookId: string, bookmarkId: string) => void;
  onAddHighlight: (
    bookId: string,
    item: Omit<HighlightItem, 'id' | 'createdAt'>,
  ) => void;
  onRemoveHighlight: (bookId: string, highlightId: string) => void;
  onClearAnnotations: (bookId: string) => void;
  onClose: () => void;
}

/** Safely highlight matching selected snippets inside React without dangerouslySetInnerHTML. */
function renderHighlightedParagraph(
  text: string,
  pageHighlights: HighlightItem[],
): ReactNode {
  if (pageHighlights.length === 0) return text;

  const matches: Array<{ start: number; end: number; color: HighlightColorKey }> = [];
  for (const hl of pageHighlights) {
    const needle = hl.selectedText.trim();
    if (!needle || needle.length < 2) continue;
    const idx = text.indexOf(needle);
    if (idx !== -1) {
      matches.push({ start: idx, end: idx + needle.length, color: hl.color });
    }
  }

  if (matches.length === 0) return text;
  matches.sort((a, b) => a.start - b.start);

  const nodes: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.start < cursor) return;
    if (m.start > cursor) {
      nodes.push(text.slice(cursor, m.start));
    }
    nodes.push(
      <mark key={`hl-${i}-${m.start}`} className={HIGHLIGHT_STYLES[m.color].markClass}>
        {text.slice(m.start, m.end)}
      </mark>,
    );
    cursor = m.end;
  });

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }
  return nodes;
}

export function BookReader({
  book,
  initialPage,
  zoom,
  theme,
  sessionSeconds,
  isMusicPlaying,
  bookmarks,
  highlights,
  onChangeZoom,
  onToggleTheme,
  onToggleMusic,
  onProgressChange,
  onToggleBookmark,
  onRemoveBookmark,
  onAddHighlight,
  onRemoveHighlight,
  onClearAnnotations,
  onClose,
}: BookReaderProps) {
  const [content, setContent] = useState<BookContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, initialPage));
  const [flipDirection, setFlipDirection] = useState<'none' | 'next' | 'prev'>('none');
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesTab, setNotesTab] = useState<'highlights' | 'bookmarks' | 'progress'>(
    'highlights',
  );
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    pageNumber: number;
    chapterTitle?: string;
  } | null>(null);

  const spreadContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const loaded = await loadBookContent(book.id);
      setContent(loaded);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Không thể tải nội dung cuốn sách.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [book.id]);

  useEffect(() => {
    void fetchContent();
  }, [fetchContent]);

  const paginated = useMemo(
    () => (content ? paginateBookContent(content) : null),
    [content],
  );

  const totalPages = paginated?.pages.length ?? 1;

  // Normalize spread anchor page (odd page in 2-page mode)
  const leftPageNum = isMobile
    ? Math.min(Math.max(1, currentPage), totalPages)
    : Math.min(
        currentPage % 2 === 0 ? Math.max(1, currentPage - 1) : Math.max(1, currentPage),
        totalPages,
      );
  const rightPageNum = !isMobile && leftPageNum + 1 <= totalPages ? leftPageNum + 1 : null;

  const leftPage = paginated?.pages[leftPageNum - 1] ?? null;
  const rightPage = rightPageNum ? paginated?.pages[rightPageNum - 1] ?? null : null;

  useEffect(() => {
    if (!paginated) return;
    const clamped = Math.min(Math.max(1, currentPage), totalPages);
    onProgressChange(book.id, clamped);
  }, [book.id, currentPage, paginated, totalPages, onProgressChange]);

  const goToPage = useCallback(
    (target: number, direction: 'next' | 'prev' | 'none' = 'none') => {
      const clamped = Math.min(Math.max(1, target), totalPages);
      const normalized = isMobile
        ? clamped
        : clamped % 2 === 0
          ? Math.max(1, clamped - 1)
          : clamped;
      setFlipDirection(direction);
      setPendingSelection(null);
      setCurrentPage(normalized);
      spreadContainerRef.current?.querySelectorAll('.reader-leaf-scroll').forEach((el) => {
        el.scrollTop = 0;
      });
    },
    [isMobile, totalPages],
  );

  const stepPage = useCallback(
    (delta: 1 | -1) => {
      const step = isMobile ? 1 : 2;
      const next = leftPageNum + delta * step;
      if (next < 1 || next > totalPages) return;
      goToPage(next, delta > 0 ? 'next' : 'prev');
    },
    [goToPage, isMobile, leftPageNum, totalPages],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (notesDialogOpen) setNotesDialogOpen(false);
        else onClose();
      } else if (e.key === 'ArrowLeft' && !notesDialogOpen) {
        stepPage(-1);
      } else if (e.key === 'ArrowRight' && !notesDialogOpen) {
        stepPage(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notesDialogOpen, onClose, stepPage]);

  const zoomIdx = Math.max(
    0,
    ZOOM_LEVELS.findIndex((z) => z === zoom),
  );

  const isSpreadBookmarked = bookmarks.some(
    (b) => b.pageNumber === leftPageNum || b.pageNumber === rightPageNum,
  );

  const currentChapterTitle =
    rightPage?.blocks[0]?.chapterTitle ??
    leftPage?.blocks[0]?.chapterTitle ??
    (leftPageNum <= 2 ? 'Mục lục' : undefined);

  // Remaining words calculation for progress bar
  const wordsRead = useMemo(() => {
    if (!paginated) return 0;
    const furthestVisible = rightPageNum ?? leftPageNum;
    let sum = 0;
    for (let i = 0; i < furthestVisible; i++) {
      sum += paginated.pages[i]?.wordCount ?? 0;
    }
    return sum;
  }, [leftPageNum, paginated, rightPageNum]);

  const furthestPage = rightPageNum ?? leftPageNum;
  const percentRead = Math.min(100, Math.round((furthestPage / totalPages) * 100));
  const remainingWords = Math.max(0, (paginated?.totalWords ?? 0) - wordsRead);

  const handleTextSelectionCapture = (page: ReaderPage) => {
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim() ?? '';
    if (selectedText.length < 3) {
      setPendingSelection(null);
      return;
    }
    setPendingSelection({
      text: selectedText.slice(0, 400),
      pageNumber: page.pageNumber,
      chapterTitle: page.blocks[0]?.chapterTitle,
    });
  };

  const renderPageContent = (page: ReaderPage | null) => {
    if (!page) {
      return (
        <div className="flex h-full items-center justify-center text-xs italic text-[var(--muted)]">
          Hết sách
        </div>
      );
    }

    const fontPx = Math.round((16 * zoom) / 100);
    const pageHighlights = highlights.filter((h) => h.pageNumber === page.pageNumber);

    if (page.kind === 'intro') {
      return (
        <div className="flex h-full flex-col justify-between">
          <div>
            <p className="font-sans-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--cobalt)]">
              {book.categoryGroup} · {book.genre}
            </p>
            <h2 className="font-serif-book mt-2 text-2xl font-medium leading-tight sm:text-3xl">
              {book.title}
            </h2>
            <p className="font-sans-ui mt-1 text-sm text-[var(--muted)]">
              Tác giả: <strong className="font-medium text-[var(--ink)]">{book.author}</strong>
            </p>
            <div className="my-5 h-px bg-[var(--border-soft)]" />
            <p
              className="font-serif-book leading-relaxed text-[var(--ink)]"
              style={{ fontSize: `${fontPx}px` }}
            >
              {book.synopsis || 'Bắt đầu lật trang để đọc nội dung tác phẩm.'}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="w-20 shrink-0">
              <BookCoverArt book={book} size="sm" className="aspect-[2/3] w-full" />
            </div>
            <div className="font-sans-ui text-xs text-[var(--muted)]">
              <p>{content?.chapters.length ?? book.chapterCount} chương</p>
              <p>~{totalPages} trang trình đọc</p>
            </div>
          </div>
        </div>
      );
    }

    if (page.kind === 'toc') {
      return (
        <div className="flex h-full flex-col">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--border-soft)] pb-2">
            <h3 className="font-serif-book text-xl font-medium">Mục lục</h3>
            <span className="font-sans-ui text-xs text-[var(--muted)]">
              {content?.chapters.length ?? 0} chương
            </span>
          </div>

          {bookmarks.length > 0 && (
            <div className="mb-3 rounded-xl border border-[var(--border-soft)] bg-[var(--paper)] p-3">
              <p className="font-sans-ui mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--cobalt)]">
                🔖 Trang đã đánh dấu ({bookmarks.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {bookmarks.map((bm) => (
                  <button
                    key={bm.id}
                    type="button"
                    onClick={() => goToPage(bm.pageNumber, 'next')}
                    className="cursor-pointer rounded-full border border-[var(--border-soft)] bg-[var(--sheet)] px-2.5 py-0.5 font-sans-ui text-[11px] hover:border-[var(--cobalt)]"
                  >
                    Trang {bm.pageNumber}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ol className="flex-1 space-y-1 overflow-y-auto pr-1">
            {content?.chapters.map((ch) => {
              const targetPage = paginated?.chapterStartPages[ch.id] ?? 3;
              return (
                <li key={ch.id}>
                  <button
                    type="button"
                    onClick={() => goToPage(targetPage, 'next')}
                    className="flex w-full cursor-pointer items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <span className="font-serif-book text-sm text-[var(--ink)]">
                      <span className="font-sans-ui mr-1.5 text-xs font-semibold text-[var(--cobalt)]">
                        {String(ch.orderIndex).padStart(2, '0')} ·
                      </span>
                      {ch.title}
                    </span>
                    <span className="shrink-0 font-sans-ui text-[11px] text-[var(--muted)]">
                      tr. {targetPage}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      );
    }

    return (
      <div
        onMouseUp={() => handleTextSelectionCapture(page)}
        onTouchEnd={() => handleTextSelectionCapture(page)}
        className="space-y-3"
        style={{ fontSize: `${fontPx}px`, lineHeight: book.isPoetry ? 1.65 : 1.75 }}
      >
        {page.blocks.map((block, idx) => (
          <div key={`${block.chapterId}-${block.paragraphIndex}-${idx}`}>
            {block.isChapterStart && (
              <div className="mb-4 border-b border-[var(--border-soft)] pb-2">
                <p className="font-sans-ui text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cobalt)]">
                  Chương {block.chapterId.split('-ch-')[1]}
                </p>
                <h3 className="font-serif-book mt-0.5 text-xl font-medium text-[var(--ink)] sm:text-2xl">
                  {block.chapterTitle}
                </h3>
              </div>
            )}
            <p
              className={`font-serif-book text-[var(--ink)] ${
                block.isPoetry ? 'mb-1 text-[0.96em]' : 'indent-5 text-justify'
              }`}
            >
              {renderHighlightedParagraph(block.text, pageHighlights)}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Trình đọc sách ${book.title}`}
      className="fixed inset-0 z-50 flex flex-col bg-[var(--paper)] text-[var(--ink)]"
    >
      {/* Top Reader Toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-soft)] bg-[var(--sheet)] px-3 py-2 sm:px-5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => goToPage(1, 'prev')}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--paper)] px-3 py-1 font-sans-ui text-xs font-medium transition hover:border-[var(--cobalt)]"
          >
            <List className="h-3.5 w-3.5" />
            <span>Mục lục</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onToggleBookmark(
                book.id,
                leftPageNum,
                currentChapterTitle,
              )
            }
            aria-pressed={isSpreadBookmarked}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 font-sans-ui text-xs font-medium transition ${
              isSpreadBookmarked
                ? 'bg-[var(--cobalt)] text-white shadow-sm'
                : 'border border-[var(--border-soft)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--cobalt)]'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Đánh dấu trang</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setConfirmClearAll(false);
              setNotesDialogOpen(true);
            }}
            aria-label="Mở tô màu, dấu trang và tiến độ"
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--paper)] px-2.5 py-1 font-sans-ui text-xs font-medium transition hover:border-[var(--cobalt)]"
          >
            <span>📑</span>
            <span className="rounded-full bg-[var(--cobalt)] px-1.5 py-0.5 text-[10px] leading-none text-white">
              {bookmarks.length + highlights.length}
            </span>
          </button>
        </div>

        {/* Center Title (desktop) */}
        <p className="hidden max-w-xs truncate font-serif-book text-sm font-medium text-[var(--ink)] lg:block">
          {book.title}
        </p>

        {/* Right Controls: Zoom, Music, Theme, Timer, Close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="inline-flex items-center rounded-full border border-[var(--border-soft)] bg-[var(--paper)] px-1 py-0.5 font-sans-ui text-xs">
            <button
              type="button"
              disabled={zoomIdx <= 0}
              onClick={() => onChangeZoom(ZOOM_LEVELS[Math.max(0, zoomIdx - 1)])}
              aria-label="Thu nhỏ chữ"
              className="cursor-pointer rounded-full px-2 py-0.5 font-medium disabled:cursor-not-allowed disabled:opacity-35"
            >
              A −
            </button>
            <button
              type="button"
              onClick={() => onChangeZoom(100)}
              title="Đặt lại 100%"
              className="cursor-pointer px-1.5 font-semibold tabular-nums text-[var(--cobalt)]"
            >
              {zoom}%
            </button>
            <button
              type="button"
              disabled={zoomIdx >= ZOOM_LEVELS.length - 1}
              onClick={() =>
                onChangeZoom(ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, zoomIdx + 1)])
              }
              aria-label="Phóng to chữ"
              className="cursor-pointer rounded-full px-2 py-0.5 font-medium disabled:cursor-not-allowed disabled:opacity-35"
            >
              A +
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleMusic}
            aria-label={isMusicPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
            className={`cursor-pointer rounded-full p-1.5 transition ${
              isMusicPlaying
                ? 'bg-[var(--cobalt)] text-white'
                : 'border border-[var(--border-soft)] bg-[var(--paper)] text-[var(--ink)]'
            }`}
          >
            <Music className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'light' ? 'Chuyển sang nền tối' : 'Chuyển sang nền sáng'
            }
            className="cursor-pointer rounded-full border border-[var(--border-soft)] bg-[var(--paper)] p-1.5 text-[var(--ink)]"
          >
            {theme === 'light' ? (
              <Moon className="h-3.5 w-3.5" />
            ) : (
              <Sun className="h-3.5 w-3.5" />
            )}
          </button>

          <span className="hidden items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--paper)] px-2.5 py-1 font-sans-ui text-[11px] tabular-nums text-[var(--muted)] sm:inline-flex">
            <Clock className="h-3 w-3" />
            {formatDurationHms(sessionSeconds)}
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trình đọc sách"
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--paper)] px-3 py-1 font-sans-ui text-xs font-semibold tracking-wider hover:border-[var(--cobalt)] hover:text-[var(--cobalt)]"
          >
            <X className="h-3.5 w-3.5" />
            ĐÓNG
          </button>
        </div>
      </header>

      {/* Highlight selection floating bar */}
      {pendingSelection && (
        <div className="z-30 flex items-center justify-center gap-2 border-b border-[var(--border-soft)] bg-[var(--sheet)] px-4 py-1.5 shadow-sm">
          <Highlighter className="h-3.5 w-3.5 text-[var(--cobalt)]" />
          <span className="max-w-[180px] truncate font-sans-ui text-xs text-[var(--muted)] sm:max-w-xs">
            Tô màu: "{pendingSelection.text}"
          </span>
          {(Object.keys(HIGHLIGHT_STYLES) as HighlightColorKey[]).map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Tô màu ${HIGHLIGHT_STYLES[color].label}`}
              onClick={() => {
                onAddHighlight(book.id, {
                  pageNumber: pendingSelection.pageNumber,
                  selectedText: pendingSelection.text,
                  color,
                  chapterTitle: pendingSelection.chapterTitle,
                });
                window.getSelection()?.removeAllRanges();
                setPendingSelection(null);
              }}
              className={`h-5 w-5 cursor-pointer rounded-full border border-black/20 transition hover:scale-110 ${HIGHLIGHT_STYLES[color].swatchClass}`}
            />
          ))}
          <button
            type="button"
            onClick={() => setPendingSelection(null)}
            className="cursor-pointer font-sans-ui text-xs text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Main Two-Page Spread Workspace on Reading Desk */}
      <main className="book-desk-surface relative flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-5">
        {isLoading && (
          <div className="flex flex-col items-center gap-2 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--cobalt)]" />
            <p className="font-sans-ui text-sm text-[var(--muted)]">
              Đang nạp trang sách…
            </p>
          </div>
        )}

        {loadError && !isLoading && (
          <div className="max-w-md rounded-2xl border border-[var(--border-soft)] bg-[var(--sheet)] p-6 text-center shadow-lg">
            <p className="font-sans-ui text-sm text-red-600 dark:text-red-400">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => void fetchContent()}
              className="mt-3 cursor-pointer rounded-full bg-[var(--cobalt)] px-4 py-1.5 font-sans-ui text-xs font-medium text-white"
            >
              Thử lại
            </button>
          </div>
        )}

        {!isLoading && !loadError && paginated && (
          <div
            className="flex h-full max-h-[780px] w-full max-w-[1060px] rounded-[20px] p-1.5 shadow-[0_28px_64px_rgba(0,0,0,0.26)] sm:p-2.5"
            style={{
              background: `linear-gradient(140deg, ${book.spinePalette.bg} 0%, ${book.spinePalette.bgDark} 100%)`,
            }}
          >
            <div
              ref={spreadContainerRef}
              key={`${leftPageNum}-${isMobile ? '1p' : '2p'}`}
              onAnimationEnd={() => setFlipDirection('none')}
              className={`relative grid h-full w-full overflow-hidden rounded-[14px] border border-black/15 bg-[var(--sheet)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2),0_4px_14px_rgba(0,0,0,0.22)] ${
                isMobile ? 'grid-cols-1' : 'grid-cols-2'
              } ${
                flipDirection === 'next'
                  ? 'animate-flip-next'
                  : flipDirection === 'prev'
                    ? 'animate-flip-prev'
                    : ''
              }`}
            >
              {/* Left / Single Page Leaf */}
              <article className="reader-leaf-scroll relative flex h-full flex-col overflow-y-auto px-5 py-6 shadow-[inset_-14px_0_24px_-18px_rgba(0,0,0,0.16)] sm:px-9 sm:py-8">
                <div className="flex-1">{renderPageContent(leftPage)}</div>
                <footer className="mt-4 flex items-center justify-between border-t border-[var(--border-soft)] pt-2 font-sans-ui text-[11px] text-[var(--muted)]">
                  <span className="truncate">{book.title}</span>
                  <span className="tabular-nums">Trang {leftPageNum}</span>
                </footer>
              </article>

              {/* Right Page Leaf (Desktop / Tablet 2-page spread) */}
              {!isMobile && (
                <article className="reader-leaf-scroll relative flex h-full flex-col overflow-y-auto border-l border-[var(--border-soft)] px-9 py-8 shadow-[inset_18px_0_28px_-18px_rgba(0,0,0,0.26)]">
                  <div className="flex-1">{renderPageContent(rightPage)}</div>
                  <footer className="mt-4 flex items-center justify-between border-t border-[var(--border-soft)] pt-2 font-sans-ui text-[11px] text-[var(--muted)]">
                    <span className="truncate">{currentChapterTitle ?? book.author}</span>
                    <span className="tabular-nums">
                      {rightPageNum ? `Trang ${rightPageNum}` : ''}
                    </span>
                  </footer>
                </article>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Reading Progress & Navigation */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-soft)] bg-[var(--sheet)] px-4 py-2.5 sm:px-6">
        <button
          type="button"
          disabled={leftPageNum <= 1}
          onClick={() => stepPage(-1)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--paper)] px-3.5 py-1.5 font-sans-ui text-xs font-medium transition hover:border-[var(--cobalt)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Trang trước
        </button>

        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <p className="font-sans-ui text-xs tabular-nums text-[var(--muted)]">
            {rightPageNum
              ? `Trang ${leftPageNum} – ${rightPageNum} / ${totalPages}`
              : `Trang ${leftPageNum} / ${totalPages}`}{' '}
            · <strong className="text-[var(--ink)]">{percentRead}%</strong> ·{' '}
            {formatRemainingTime(remainingWords)}
          </p>
          <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--cobalt)] transition-all duration-300"
              style={{ width: `${percentRead}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={(rightPageNum ?? leftPageNum) >= totalPages}
          onClick={() => stepPage(1)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-[var(--cobalt)] px-3.5 py-1.5 font-sans-ui text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trang sau
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </footer>

      {/* FR-07 Fixed Notes / Bookmarks / Progress Dialog (tabs strictly INSIDE dialog header) */}
      {notesDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tô màu, dấu trang và tiến độ"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNotesDialogOpen(false);
          }}
        >
          <div className="flex max-h-[84vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--sheet)] text-[var(--ink)] shadow-2xl">
            {/* Dialog Header with Tabs Inside */}
            <div className="border-b border-[var(--border-soft)] px-5 pt-4 pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif-book text-lg font-medium">
                  Tô màu, dấu trang và tiến độ
                </h3>
                <button
                  type="button"
                  onClick={() => setNotesDialogOpen(false)}
                  aria-label="Đóng hộp thoại ghi chú"
                  className="cursor-pointer rounded-full p-1 text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                role="tablist"
                aria-label="Các mục ghi chú"
                className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-[var(--paper)] p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={notesTab === 'highlights'}
                  onClick={() => setNotesTab('highlights')}
                  className={`cursor-pointer rounded-lg py-1.5 font-sans-ui text-xs font-medium transition ${
                    notesTab === 'highlights'
                      ? 'bg-[var(--cobalt)] text-white shadow-sm'
                      : 'text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  🖍 Tô ({highlights.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={notesTab === 'bookmarks'}
                  onClick={() => setNotesTab('bookmarks')}
                  className={`cursor-pointer rounded-lg py-1.5 font-sans-ui text-xs font-medium transition ${
                    notesTab === 'bookmarks'
                      ? 'bg-[var(--cobalt)] text-white shadow-sm'
                      : 'text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  🔖 Trang ({bookmarks.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={notesTab === 'progress'}
                  onClick={() => setNotesTab('progress')}
                  className={`cursor-pointer rounded-lg py-1.5 font-sans-ui text-xs font-medium transition ${
                    notesTab === 'progress'
                      ? 'bg-[var(--cobalt)] text-white shadow-sm'
                      : 'text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  📊 Tiến độ
                </button>
              </div>
            </div>

            {/* Dialog Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {notesTab === 'highlights' && (
                <div>
                  {highlights.length === 0 ? (
                    <p className="py-8 text-center font-sans-ui text-xs text-[var(--muted)]">
                      Bôi đen một đoạn văn trên trang sách để tô màu và lưu ghi chú tại đây.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {highlights.map((hl) => (
                        <li
                          key={hl.id}
                          className="flex items-start justify-between gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--paper)] p-3"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setNotesDialogOpen(false);
                              goToPage(hl.pageNumber, 'next');
                            }}
                            className="flex-1 cursor-pointer text-left"
                          >
                            <p className="font-serif-book text-sm text-[var(--ink)]">
                              <mark className={HIGHLIGHT_STYLES[hl.color].markClass}>
                                “{hl.selectedText}”
                              </mark>
                            </p>
                            <p className="mt-1 font-sans-ui text-[11px] text-[var(--muted)]">
                              Trang {hl.pageNumber}
                              {hl.chapterTitle ? ` · ${hl.chapterTitle}` : ''}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveHighlight(book.id, hl.id)}
                            aria-label="Xóa đoạn tô màu"
                            className="cursor-pointer rounded-lg p-1 text-[var(--muted)] hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {notesTab === 'bookmarks' && (
                <div>
                  {bookmarks.length === 0 ? (
                    <p className="py-8 text-center font-sans-ui text-xs text-[var(--muted)]">
                      Chưa có dấu trang nào cho cuốn sách này.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {bookmarks.map((bm) => (
                        <li
                          key={bm.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--paper)] px-3 py-2.5"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setNotesDialogOpen(false);
                              goToPage(bm.pageNumber, 'next');
                            }}
                            className="flex-1 cursor-pointer text-left font-sans-ui text-xs"
                          >
                            <span className="font-semibold text-[var(--cobalt)]">
                              🔖 Trang {bm.pageNumber}
                            </span>
                            {bm.chapterTitle && (
                              <span className="ml-2 text-[var(--muted)]">
                                {bm.chapterTitle}
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveBookmark(book.id, bm.id)}
                            aria-label={`Xóa dấu trang ${bm.pageNumber}`}
                            className="cursor-pointer rounded-lg p-1 text-[var(--muted)] hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {notesTab === 'progress' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--paper)] p-4">
                    <div>
                      <p className="font-sans-ui text-[11px] text-[var(--muted)]">
                        Tiến độ hiện tại
                      </p>
                      <p className="font-serif-book text-2xl font-medium text-[var(--cobalt)]">
                        {percentRead}%
                      </p>
                    </div>
                    <div>
                      <p className="font-sans-ui text-[11px] text-[var(--muted)]">
                        Thời gian ước tính
                      </p>
                      <p className="font-serif-book text-lg font-medium">
                        {formatRemainingTime(remainingWords)}
                      </p>
                    </div>
                  </div>
                  <p className="font-sans-ui text-xs text-[var(--muted)]">
                    Trang đang mở: <strong>{furthestPage}</strong> / {totalPages} trang · Tổng chữ:{' '}
                    {(paginated?.totalWords ?? 0).toLocaleString('vi-VN')} từ.
                  </p>
                </div>
              )}
            </div>

            {/* Dialog Footer with Safe Clear-All Confirmation */}
            {(bookmarks.length > 0 || highlights.length > 0) && (
              <div className="flex items-center justify-between border-t border-[var(--border-soft)] bg-[var(--paper)] px-5 py-3">
                {!confirmClearAll ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 font-sans-ui text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa tất cả dấu trang &amp; tô màu
                  </button>
                ) : (
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-sans-ui text-xs font-medium text-red-600 dark:text-red-400">
                      Xác nhận xóa toàn bộ?
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmClearAll(false)}
                        className="cursor-pointer rounded-full border border-[var(--border-soft)] px-3 py-1 font-sans-ui text-xs"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClearAnnotations(book.id);
                          setConfirmClearAll(false);
                        }}
                        className="cursor-pointer rounded-full bg-red-600 px-3 py-1 font-sans-ui text-xs font-medium text-white"
                      >
                        Xóa hết
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
