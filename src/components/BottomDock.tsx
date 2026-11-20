import { useRef, useState } from 'react';
import {
  Clock,
  HardDriveDownload,
  History,
  ListMusic,
  Moon,
  Plus,
  Search,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { searchBooks } from '../data/search';
import type {
  AudioTrackItem,
  BookMeta,
  FilterCriteria,
  ReadingHistoryItem,
  ThemeMode,
  UserBookState,
} from '../data/types';
import { isFilterActive } from '../data/filters';
import { formatDateTimeVi, formatDurationHms } from '../utils/formatters';
import { FilterPopover } from './FilterPopover';

interface BottomDockProps {
  allBooks: BookMeta[];
  categories: string[];
  filters: FilterCriteria;
  bookStates: Record<string, UserBookState>;
  theme: ThemeMode;
  sessionSeconds: number;
  history: ReadingHistoryItem[];
  tracks: AudioTrackItem[];
  currentTrackIndex: number;
  isMusicPlaying: boolean;
  onChangeFilters: (next: FilterCriteria) => void;
  onResetFilters: () => void;
  onToggleTheme: () => void;
  onFocusBook: (bookId: string) => void;
  onOpenDetail: (book: BookMeta) => void;
  onPickRandom: (pool: BookMeta[]) => void;
  onToggleMusic: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSelectTrack: (index: number) => void;
  onUploadMp3Files: (files: FileList) => void;
  onDeletePersonalTrack: (trackId: string) => void;
  onOpenBackup: () => void;
}

type OpenPopover = 'none' | 'filter' | 'history' | 'playlist';

export function BottomDock({
  allBooks,
  categories,
  filters,
  bookStates,
  theme,
  sessionSeconds,
  history,
  tracks,
  currentTrackIndex,
  isMusicPlaying,
  onChangeFilters,
  onResetFilters,
  onToggleTheme,
  onFocusBook,
  onOpenDetail,
  onPickRandom,
  onToggleMusic,
  onPrevTrack,
  onNextTrack,
  onSelectTrack,
  onUploadMp3Files,
  onDeletePersonalTrack,
  onOpenBackup,
}: BottomDockProps) {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [openPopover, setOpenPopover] = useState<OpenPopover>('none');
  const mp3InputRef = useRef<HTMLInputElement>(null);

  const suggestions = searchBooks(allBooks, query, 6);
  const activeFilterDot = isFilterActive(filters);
  const currentTrack = tracks[currentTrackIndex] ?? tracks[0];
  const bookMap = new Map(allBooks.map((b) => [b.id, b]));

  const togglePopover = (target: OpenPopover) => {
    setSearchOpen(false);
    setOpenPopover((prev) => (prev === target ? 'none' : target));
  };

  return (
    <div className="relative z-30 mx-auto w-full max-w-4xl px-3 pb-2 sm:px-4">
      {/* Popover Layer anchored above the dock */}
      <div className="relative flex justify-center">
        {searchOpen && query.trim().length > 0 && (
          <div
            role="listbox"
            aria-label="Gợi ý truyện"
            className="absolute bottom-3 left-0 z-40 w-[min(92vw,380px)] rounded-2xl border border-[var(--border-soft)] bg-[var(--glass-strong)] p-2 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-1 flex items-center justify-between px-2 py-1">
              <span className="font-sans-ui text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Gợi ý truyện
              </span>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="cursor-pointer text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
              >
                Đóng
              </button>
            </div>
            {suggestions.length === 0 ? (
              <p className="px-3 py-3 font-sans-ui text-xs text-[var(--muted)]">
                Không tìm thấy sách khớp "{query}".
              </p>
            ) : (
              <ul className="space-y-1">
                {suggestions.map((book) => (
                  <li key={book.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        onFocusBook(book.id);
                        onOpenDetail(book);
                      }}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-serif-book text-sm font-medium text-[var(--ink)]">
                          {book.title}
                        </p>
                        <p className="truncate font-sans-ui text-[11px] text-[var(--muted)]">
                          {book.author} · {book.categoryGroup}
                        </p>
                      </div>
                      <span className="shrink-0 font-sans-ui text-[11px] text-[var(--muted)]">
                        {book.year ?? `${book.chapterCount} ch.`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {openPopover === 'filter' && (
          <div className="absolute bottom-3 z-40">
            <FilterPopover
              allBooks={allBooks}
              categories={categories}
              filters={filters}
              bookStates={bookStates}
              onChangeFilters={onChangeFilters}
              onResetFilters={onResetFilters}
              onSelectBook={(book) => {
                setOpenPopover('none');
                onFocusBook(book.id);
                onOpenDetail(book);
              }}
              onPickRandom={(pool) => {
                setOpenPopover('none');
                onPickRandom(pool);
              }}
              onClose={() => setOpenPopover('none')}
            />
          </div>
        )}

        {openPopover === 'history' && (
          <div
            role="dialog"
            aria-label="Lịch sử đọc sách"
            className="absolute bottom-3 right-0 z-40 w-[min(92vw,380px)] rounded-2xl border border-[var(--border-soft)] bg-[var(--glass-strong)] p-4 text-[var(--ink)] shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="font-serif-book text-base font-medium">Đọc gần đây</h3>
                <p className="font-sans-ui text-[11px] text-[var(--muted)]">
                  Chỉ lưu trên thiết bị này
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenPopover('none')}
                aria-label="Đóng lịch sử đọc"
                className="cursor-pointer rounded-full p-1 text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {history.length === 0 ? (
              <p className="py-6 text-center font-sans-ui text-xs text-[var(--muted)]">
                Bạn chưa mở đọc cuốn sách nào trong thư viện.
              </p>
            ) : (
              <ul className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {history.map((item) => {
                  const book = bookMap.get(item.bookId);
                  if (!book) return null;
                  return (
                    <li key={item.bookId}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenPopover('none');
                          onFocusBook(book.id);
                          onOpenDetail(book);
                        }}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--sheet)] p-2 text-left transition hover:border-[var(--cobalt)]"
                      >
                        <div
                          className="flex h-10 w-7 shrink-0 items-center justify-center rounded-sm font-serif-book text-xs font-semibold shadow-sm"
                          style={{
                            background: book.spinePalette.bg,
                            color: book.spinePalette.text,
                          }}
                        >
                          {book.title.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-serif-book text-sm font-medium text-[var(--ink)]">
                            {book.title}
                          </p>
                          <p className="font-sans-ui text-[11px] text-[var(--muted)]">
                            Trang {item.lastPage} · {formatDateTimeVi(item.openedAt)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {openPopover === 'playlist' && (
          <div
            role="dialog"
            aria-label="Danh sách phát nhạc nền"
            className="absolute bottom-3 left-0 z-40 w-[min(92vw,400px)] rounded-2xl border border-[var(--border-soft)] bg-[var(--glass-strong)] p-4 text-[var(--ink)] shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-2.5 flex items-center justify-between">
              <div>
                <h3 className="font-serif-book text-base font-medium">Danh sách phát</h3>
                <p className="font-sans-ui text-[11px] text-[var(--muted)]">
                  Piano thư giãn &amp; nhạc MP3 cá nhân
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenPopover('none')}
                aria-label="Đóng danh sách phát"
                className="cursor-pointer rounded-full p-1 text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {tracks.map((track, idx) => {
                const isSelected = idx === currentTrackIndex;
                return (
                  <li key={track.id} className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectTrack(idx)}
                      className={`flex flex-1 cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-left font-sans-ui text-xs transition ${
                        isSelected
                          ? 'bg-[var(--cobalt)] text-white'
                          : 'bg-[var(--sheet)] text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate font-medium">
                        {idx + 1}. {track.title}
                      </span>
                      <span
                        className={`ml-2 shrink-0 text-[10px] ${
                          isSelected ? 'text-white/80' : 'text-[var(--muted)]'
                        }`}
                      >
                        {track.sourceType === 'local-mp3' ? 'MP3' : `${track.bpm} bpm`}
                      </span>
                    </button>
                    {track.sourceType === 'local-mp3' && (
                      <button
                        type="button"
                        onClick={() => onDeletePersonalTrack(track.id)}
                        aria-label={`Xóa bài ${track.title}`}
                        className="cursor-pointer rounded-lg p-1.5 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-[var(--border-soft)] pt-2.5">
              <input
                ref={mp3InputRef}
                type="file"
                accept=".mp3,audio/mpeg,audio/mp3"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onUploadMp3Files(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
              <button
                type="button"
                onClick={() => mp3InputRef.current?.click()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[var(--cobalt)] px-3 py-1.5 font-sans-ui text-xs font-medium text-white transition hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                + Thêm nhạc MP3
              </button>
              <span className="font-sans-ui text-[10px] text-[var(--muted)]">
                Lưu cục bộ IndexedDB
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Row Floating Bottom Dock */}
      <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--glass)] p-2 shadow-lg backdrop-blur-xl sm:p-2.5">
        {/* Row 1: Search, Filter, Theme, Timer, History */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[170px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              value={query}
              aria-label="Tìm truyện"
              placeholder="Tìm truyện…"
              onFocus={() => {
                setOpenPopover('none');
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchOpen(false);
              }}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              className="w-full rounded-full border border-[var(--border-soft)] bg-[var(--sheet)] py-1.5 pr-7 pl-8 font-sans-ui text-xs text-[var(--ink)] outline-none transition focus:border-[var(--cobalt)]"
            />
            {query && (
              <button
                type="button"
                aria-label="Xóa từ khóa tìm kiếm"
                onClick={() => {
                  setQuery('');
                  setSearchOpen(false);
                }}
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-0.5 text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => togglePopover('filter')}
            className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--sheet)] px-3 py-1.5 font-sans-ui text-xs font-medium text-[var(--ink)] transition hover:border-[var(--cobalt)]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Lọc kệ sách</span>
            {activeFilterDot && (
              <span
                aria-label="Bộ lọc đang kích hoạt"
                className="h-2 w-2 rounded-full bg-red-500"
              />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'
            }
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--sheet)] px-2.5 py-1.5 font-sans-ui text-xs font-medium text-[var(--ink)] transition hover:border-[var(--cobalt)]"
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tối</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sáng</span>
              </>
            )}
          </button>

          <div
            aria-label="Thời gian đọc trong phiên"
            className="inline-flex items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--sheet)] px-2.5 py-1.5 font-sans-ui text-xs tabular-nums text-[var(--muted)]"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDurationHms(sessionSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => togglePopover('history')}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--sheet)] px-3 py-1.5 font-sans-ui text-xs font-medium text-[var(--ink)] transition hover:border-[var(--cobalt)]"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Lịch sử đọc sách</span>
            <span className="sm:hidden">Lịch sử</span>
          </button>
        </div>

        {/* Row 2: Ambient Music Player & Backup Trigger */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-soft)] pt-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => togglePopover('playlist')}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--sheet)] px-2.5 py-1 font-sans-ui text-xs font-medium text-[var(--ink)] transition hover:border-[var(--cobalt)]"
            >
              <ListMusic className="h-3.5 w-3.5 text-[var(--cobalt)]" />
              <span className="hidden sm:inline">Danh sách phát</span>
            </button>

            <button
              type="button"
              onClick={() => togglePopover('playlist')}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
            >
              {isMusicPlaying && (
                <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
                  <span className="eq-bar-1 h-3 w-[2px] rounded-full bg-[var(--cobalt)]" />
                  <span className="eq-bar-2 h-3 w-[2px] rounded-full bg-[var(--cobalt)]" />
                  <span className="eq-bar-3 h-3 w-[2px] rounded-full bg-[var(--cobalt)]" />
                </span>
              )}
              <span className="truncate font-sans-ui text-xs text-[var(--ink)]">
                {currentTrack?.title ?? 'Chưa có bài nhạc'}
              </span>
              <span className="shrink-0 font-sans-ui text-[11px] text-[var(--muted)]">
                ({currentTrackIndex + 1}/{tracks.length})
              </span>
            </button>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={onPrevTrack}
                aria-label="Bài trước"
                className="cursor-pointer rounded-full p-1 text-[var(--ink)] transition hover:bg-black/5 dark:hover:bg-white/10"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onNextTrack}
                aria-label="Bài sau"
                className="cursor-pointer rounded-full p-1 text-[var(--ink)] transition hover:bg-black/5 dark:hover:bg-white/10"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={isMusicPlaying}
                onClick={onToggleMusic}
                className={`cursor-pointer rounded-full px-3 py-1 font-sans-ui text-xs font-medium transition ${
                  isMusicPlaying
                    ? 'bg-[var(--cobalt)] text-white shadow-sm'
                    : 'border border-[var(--border-soft)] bg-[var(--sheet)] text-[var(--ink)] hover:border-[var(--cobalt)]'
                }`}
              >
                {isMusicPlaying ? 'Đang phát' : 'Bật nhạc'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBackup}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--sheet)] px-3 py-1 font-sans-ui text-xs font-medium text-[var(--ink)] transition hover:border-[var(--cobalt)] hover:text-[var(--cobalt)]"
          >
            <HardDriveDownload className="h-3.5 w-3.5" />
            <span>Xuất / Nhập dữ liệu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
