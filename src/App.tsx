import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AmbientAudioEngine } from './audio/ambientEngine';
import { BackupModal } from './components/BackupModal';
import { BookDetailModal } from './components/BookDetailModal';
import { BookReader } from './components/BookReader';
import { Bookshelf3D } from './components/Bookshelf3D';
import { BottomDock } from './components/BottomDock';
import { CategoryTabs } from './components/CategoryTabs';
import { Header } from './components/Header';
import { MeadowBackdrop } from './components/MeadowBackdrop';
import { NewBooksModal } from './components/NewBooksModal';

const PersonalLibraryOverlay = lazy(() =>
  import('./components/PersonalLibraryOverlay').then((m) => ({
    default: m.PersonalLibraryOverlay,
  })),
);
import { siteConfig } from './config/site';
import { getCatalog, getCategoryGroups } from './data/adapter';
import { getBundledAudioTracks } from './data/audioLoader';
import { DEFAULT_FILTERS, filterBooks, pickRandomBook } from './data/filters';
import {
  PERSONAL_TAB_ID,
  type AudioTrackItem,
  type BackupPayload,
  type BookMeta,
  type BookmarkItem,
  type FilterCriteria,
  type HighlightItem,
  type PersonalBookRecord,
  type PersonalTrackRecord,
  type ReadingHistoryItem,
  type UserBookState,
  type UserPreferences,
} from './data/types';
import {
  addPersonalBook,
  addPersonalTrack,
  listPersonalBooks,
  listPersonalTracks,
  removePersonalBook,
  removePersonalTrack,
} from './storage/indexedDb';
import {
  loadBookmarks,
  loadBookStates,
  loadHighlights,
  loadPreferences,
  loadReadingHistory,
  saveBookmarks,
  saveBookStates,
  saveHighlights,
  savePreferences,
  saveReadingHistory,
} from './storage/localState';

const SESSION_DISMISS_NEW_KEY = 'sach_cua_dang_hide_new_modal';

export function App() {
  const allBooks = useMemo(() => getCatalog(), []);
  const categories = useMemo(() => getCategoryGroups(allBooks), [allBooks]);

  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences());
  const [bookStates, setBookStates] = useState<Record<string, UserBookState>>(() =>
    loadBookStates(),
  );
  const [bookmarks, setBookmarks] = useState<Record<string, BookmarkItem[]>>(() =>
    loadBookmarks(),
  );
  const [highlights, setHighlights] = useState<Record<string, HighlightItem[]>>(() =>
    loadHighlights(),
  );
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>(() =>
    loadReadingHistory(),
  );

  const [personalBooks, setPersonalBooks] = useState<PersonalBookRecord[]>([]);
  const [personalTracks, setPersonalTracks] = useState<PersonalTrackRecord[]>([]);

  const [filters, setFilters] = useState<FilterCriteria>(DEFAULT_FILTERS);
  const [activeBookId, setActiveBookId] = useState<string | null>(
    () => allBooks[0]?.id ?? null,
  );
  const [detailBook, setDetailBook] = useState<BookMeta | null>(null);
  const [readingBook, setReadingBook] = useState<BookMeta | null>(null);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  const newBooks = useMemo(() => allBooks.filter((b) => b.isNew), [allBooks]);
  const [newModalOpen, setNewModalOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      allBooks.some((b) => b.isNew) &&
      sessionStorage.getItem(SESSION_DISMISS_NEW_KEY) !== '1'
    );
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 4200);
  }, []);

  // Session reading clock
  const [sessionSeconds, setSessionSeconds] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Sync theme with <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
  }, [preferences.theme]);

  // Persist lightweight state to localStorage
  useEffect(() => savePreferences(preferences), [preferences]);
  useEffect(() => saveBookStates(bookStates), [bookStates]);
  useEffect(() => saveBookmarks(bookmarks), [bookmarks]);
  useEffect(() => saveHighlights(highlights), [highlights]);
  useEffect(() => saveReadingHistory(readingHistory), [readingHistory]);

  // Hydrate IndexedDB stores
  useEffect(() => {
    void listPersonalBooks().then(setPersonalBooks).catch(() => {});
    void listPersonalTracks().then(setPersonalTracks).catch(() => {});
  }, []);

  // Audio player state & engine
  const audioEngineRef = useRef<AmbientAudioEngine | null>(null);
  if (!audioEngineRef.current) {
    audioEngineRef.current = new AmbientAudioEngine();
  }
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const musicVolume = preferences.musicVolume ?? 0.75;

  useEffect(() => {
    audioEngineRef.current?.setVolume(musicVolume);
  }, [musicVolume]);

  const bundledAudioTracks = useMemo(() => getBundledAudioTracks(), []);

  const allTracks: AudioTrackItem[] = useMemo(() => {
    const custom: AudioTrackItem[] = personalTracks.map((t) => ({
      id: t.id,
      title: t.title,
      bpm: t.bpm,
      sourceType: 'local-mp3',
    }));
    return [...bundledAudioTracks, ...siteConfig.defaultAudioTracks, ...custom];
  }, [bundledAudioTracks, personalTracks]);

  const personalTrackBlobMap = useMemo(() => {
    const map = new Map<string, Blob>();
    for (const t of personalTracks) map.set(t.id, t.audioBlob);
    return map;
  }, [personalTracks]);

  const startTrackAt = useCallback(
    async (idx: number) => {
      const engine = audioEngineRef.current;
      if (!engine || allTracks.length === 0) return;
      const safeIdx = ((idx % allTracks.length) + allTracks.length) % allTracks.length;
      const track = allTracks[safeIdx];
      setCurrentTrackIndex(safeIdx);
      if (track.sourceType === 'static-file' && track.url) {
        try {
          await engine.playUrl(track.url, () => {
            void startTrackAt(safeIdx + 1);
          });
          setIsMusicPlaying(true);
          return;
        } catch {
          showToast('Không thể phát tệp nhạc này.');
        }
      }
      if (track.sourceType === 'local-mp3') {
        const blob = personalTrackBlobMap.get(track.id);
        if (blob) {
          try {
            await engine.playBlob(blob, () => {
              void startTrackAt(safeIdx + 1);
            });
            setIsMusicPlaying(true);
            return;
          } catch {
            showToast('Không thể phát tệp MP3 này.');
          }
        }
      }
      engine.playSynth(track);
      setIsMusicPlaying(true);
    },
    [allTracks, personalTrackBlobMap, showToast],
  );

  const handleToggleMusic = useCallback(() => {
    const engine = audioEngineRef.current;
    if (!engine) return;
    if (isMusicPlaying) {
      engine.stop();
      setIsMusicPlaying(false);
    } else {
      void startTrackAt(currentTrackIndex);
    }
  }, [currentTrackIndex, isMusicPlaying, startTrackAt]);

  useEffect(() => {
    const engine = audioEngineRef.current;
    return () => {
      engine?.dispose();
    };
  }, []);

  // Category & filter book derivation
  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of allBooks) {
      counts[b.categoryGroup] = (counts[b.categoryGroup] ?? 0) + 1;
    }
    return counts;
  }, [allBooks]);

  const filteredBooks = useMemo(() => {
    const base =
      preferences.activeCategory === 'Tất cả' ||
      preferences.activeCategory === PERSONAL_TAB_ID
        ? allBooks
        : allBooks.filter((b) => b.categoryGroup === preferences.activeCategory);
    return filterBooks(base, filters, bookStates);
  }, [allBooks, bookStates, filters, preferences.activeCategory]);

  // Ensure activeBookId remains inside current filtered shelf
  useEffect(() => {
    if (filteredBooks.length === 0) {
      setActiveBookId(null);
      return;
    }
    if (!activeBookId || !filteredBooks.some((b) => b.id === activeBookId)) {
      setActiveBookId(filteredBooks[0].id);
    }
  }, [activeBookId, filteredBooks]);

  const updateBookState = useCallback(
    (bookId: string, patch: Partial<UserBookState>) => {
      setBookStates((prev) => ({
        ...prev,
        [bookId]: { ...prev[bookId], ...patch },
      }));
    },
    [],
  );

  const openBookReader = useCallback(
    (book: BookMeta) => {
      const now = new Date().toISOString();
      const existingPage = bookStates[book.id]?.lastPage ?? 1;
      setDetailBook(null);
      setReadingBook(book);

      setBookStates((prev) => ({
        ...prev,
        [book.id]: {
          ...prev[book.id],
          status: prev[book.id]?.status ?? 'reading',
          lastPage: existingPage,
          lastOpenedAt: now,
        },
      }));

      setReadingHistory((prev) => {
        const rest = prev.filter((item) => item.bookId !== book.id);
        return [{ bookId: book.id, openedAt: now, lastPage: existingPage }, ...rest].slice(
          0,
          50,
        );
      });
    },
    [bookStates],
  );

  const handleReaderProgress = useCallback((bookId: string, pageNumber: number) => {
    setBookStates((prev) => {
      const cur = prev[bookId];
      if (cur?.lastPage === pageNumber) return prev;
      return {
        ...prev,
        [bookId]: { ...cur, lastPage: pageNumber },
      };
    });
    setReadingHistory((prev) =>
      prev.map((item) =>
        item.bookId === bookId ? { ...item, lastPage: pageNumber } : item,
      ),
    );
  }, []);

  const handleToggleBookmark = useCallback(
    (bookId: string, pageNumber: number, chapterTitle?: string) => {
      setBookmarks((prev) => {
        const list = prev[bookId] ?? [];
        const existing = list.find((b) => b.pageNumber === pageNumber);
        if (existing) {
          return { ...prev, [bookId]: list.filter((b) => b.id !== existing.id) };
        }
        const nextItem: BookmarkItem = {
          id: `bm-${Date.now()}-${pageNumber}`,
          pageNumber,
          chapterTitle,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          [bookId]: [...list, nextItem].sort((a, b) => a.pageNumber - b.pageNumber),
        };
      });
    },
    [],
  );

  const handleRemoveBookmark = useCallback((bookId: string, bookmarkId: string) => {
    setBookmarks((prev) => ({
      ...prev,
      [bookId]: (prev[bookId] ?? []).filter((b) => b.id !== bookmarkId),
    }));
  }, []);

  const handleAddHighlight = useCallback(
    (bookId: string, item: Omit<HighlightItem, 'id' | 'createdAt'>) => {
      setHighlights((prev) => ({
        ...prev,
        [bookId]: [
          ...(prev[bookId] ?? []),
          {
            ...item,
            id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    },
    [],
  );

  const handleRemoveHighlight = useCallback((bookId: string, highlightId: string) => {
    setHighlights((prev) => ({
      ...prev,
      [bookId]: (prev[bookId] ?? []).filter((h) => h.id !== highlightId),
    }));
  }, []);

  const handleClearAnnotations = useCallback((bookId: string) => {
    setBookmarks((prev) => ({ ...prev, [bookId]: [] }));
    setHighlights((prev) => ({ ...prev, [bookId]: [] }));
    showToast('Đã xóa toàn bộ dấu trang và đoạn tô màu của cuốn sách.');
  }, [showToast]);

  const handlePickRandom = useCallback(
    (pool: BookMeta[]) => {
      const picked = pickRandomBook(pool, activeBookId ?? undefined);
      if (!picked) return;
      setPreferences((p) => ({ ...p, activeCategory: 'Tất cả' }));
      setActiveBookId(picked.id);
      showToast(
        `🎲 Gợi ý cho bạn: ${picked.title} — ${picked.author}${
          picked.year ? ` (${picked.year})` : ''
        }`,
      );
    },
    [activeBookId, showToast],
  );

  const handleUploadMp3Files = useCallback(
    async (files: FileList) => {
      const audioExtRe = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;
      let added = 0;
      for (const file of Array.from(files)) {
        if (
          !audioExtRe.test(file.name) &&
          !file.type.startsWith('audio/')
        ) {
          continue;
        }
        const rec: PersonalTrackRecord = {
          id: `mp3-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: file.name.replace(audioExtRe, ''),
          bpm: 72,
          audioBlob: file,
          addedAt: new Date().toISOString(),
        };
        await addPersonalTrack(rec);
        added++;
      }
      if (added > 0) {
        const refreshed = await listPersonalTracks();
        setPersonalTracks(refreshed);
        showToast(`Đã thêm ${added} bản nhạc cá nhân.`);
      } else {
        showToast('Chỉ hỗ trợ tệp âm thanh (.mp3, .wav, .ogg, .m4a).');
      }
    },
    [showToast],
  );

  const handleDeletePersonalTrack = useCallback(
    async (trackId: string) => {
      await removePersonalTrack(trackId);
      const refreshed = await listPersonalTracks();
      setPersonalTracks(refreshed);
      const totalRemaining =
        bundledAudioTracks.length + siteConfig.defaultAudioTracks.length + refreshed.length;
      if (currentTrackIndex >= totalRemaining) {
        setCurrentTrackIndex(0);
      }
    },
    [bundledAudioTracks.length, currentTrackIndex],
  );

  const handleApplyRestore = useCallback(
    (next: Omit<BackupPayload, 'app' | 'schemaVersion' | 'exportedAt'>) => {
      setBookStates(next.bookStates);
      setBookmarks(next.bookmarks);
      setHighlights(next.highlights);
      setReadingHistory(next.readingHistory);
      if (next.preferences) {
        setPreferences(next.preferences);
      }
    },
    [],
  );

  const readCount = useMemo(
    () => Object.values(bookStates).filter((s) => s.status === 'read').length,
    [bookStates],
  );
  const readingCount = useMemo(
    () => Object.values(bookStates).filter((s) => s.status === 'reading').length,
    [bookStates],
  );

  return (
    <div className="meadow-backdrop relative flex min-h-screen flex-col justify-between overflow-hidden">
      <MeadowBackdrop theme={preferences.theme} />

      <Header
        totalBooks={allBooks.length}
        readCount={readCount}
        readingCount={readingCount}
        onOpenBackup={() => setBackupOpen(true)}
      />

      <CategoryTabs
        categories={categories}
        activeCategory={personalOpen ? PERSONAL_TAB_ID : preferences.activeCategory}
        countsByCategory={countsByCategory}
        totalCount={allBooks.length}
        personalCount={personalBooks.length}
        personalLabel={siteConfig.personalTabLabel}
        onSelectCategory={(cat) => {
          if (cat === PERSONAL_TAB_ID) {
            setPersonalOpen(true);
          } else {
            setPersonalOpen(false);
            setPreferences((p) => ({ ...p, activeCategory: cat }));
          }
        }}
      />

      <Bookshelf3D
        books={filteredBooks}
        activeBookId={activeBookId}
        bookStates={bookStates}
        onFocusBook={(bookId) => setActiveBookId(bookId)}
        onOpenDetail={(book) => setDetailBook(book)}
      />

      {/* Toast Banner */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--border-soft)] bg-[var(--glass-strong)] px-4 py-2 font-sans-ui text-xs font-medium text-[var(--ink)] shadow-xl backdrop-blur-md"
        >
          {toastMsg}
        </div>
      )}

      <BottomDock
        allBooks={allBooks}
        categories={categories}
        filters={filters}
        bookStates={bookStates}
        theme={preferences.theme}
        sessionSeconds={sessionSeconds}
        history={readingHistory}
        tracks={allTracks}
        currentTrackIndex={currentTrackIndex}
        isMusicPlaying={isMusicPlaying}
        musicVolume={musicVolume}
        onChangeFilters={(next) => setFilters(next)}
        onResetFilters={() => setFilters(DEFAULT_FILTERS)}
        onToggleTheme={() =>
          setPreferences((p) => ({
            ...p,
            theme: p.theme === 'light' ? 'dark' : 'light',
          }))
        }
        onFocusBook={(bookId) => {
          setPreferences((p) => ({ ...p, activeCategory: 'Tất cả' }));
          setActiveBookId(bookId);
        }}
        onOpenDetail={(book) => setDetailBook(book)}
        onPickRandom={handlePickRandom}
        onToggleMusic={handleToggleMusic}
        onChangeMusicVolume={(v) =>
          setPreferences((p) => ({ ...p, musicVolume: v }))
        }
        onPrevTrack={() => void startTrackAt(currentTrackIndex - 1)}
        onNextTrack={() => void startTrackAt(currentTrackIndex + 1)}
        onSelectTrack={(idx) => void startTrackAt(idx)}
        onUploadMp3Files={(files) => void handleUploadMp3Files(files)}
        onDeletePersonalTrack={(id) => void handleDeletePersonalTrack(id)}
        onOpenBackup={() => setBackupOpen(true)}
      />

      {/* Personal Footer */}
      <footer className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-1 pb-3 font-sans-ui text-[11px] text-white/85 drop-shadow-sm sm:px-6">
        <span>{siteConfig.footerNote}</span>
        <span className="hidden sm:inline">
          Lưu trữ cục bộ · {allBooks.length} đầu sách sẵn sàng
        </span>
      </footer>

      {/* Modals & Overlays */}
      {newModalOpen && newBooks.length > 0 && (
        <NewBooksModal
          newBooks={newBooks}
          onReadNow={(b) => {
            setNewModalOpen(false);
            openBookReader(b);
          }}
          onGoToBook={(b) => {
            setNewModalOpen(false);
            setPreferences((p) => ({ ...p, activeCategory: 'Tất cả' }));
            setActiveBookId(b.id);
          }}
          onDismiss={(suppress) => {
            if (suppress) sessionStorage.setItem(SESSION_DISMISS_NEW_KEY, '1');
            setNewModalOpen(false);
          }}
        />
      )}

      {detailBook && (
        <BookDetailModal
          book={detailBook}
          bookState={bookStates[detailBook.id]}
          onClose={() => setDetailBook(null)}
          onUpdateState={updateBookState}
          onStartReading={openBookReader}
        />
      )}

      {readingBook && (
        <BookReader
          book={readingBook}
          initialPage={bookStates[readingBook.id]?.lastPage ?? 1}
          zoom={preferences.readerZoom}
          theme={preferences.theme}
          sessionSeconds={sessionSeconds}
          isMusicPlaying={isMusicPlaying}
          bookmarks={bookmarks[readingBook.id] ?? []}
          highlights={highlights[readingBook.id] ?? []}
          onChangeZoom={(z) => setPreferences((p) => ({ ...p, readerZoom: z }))}
          onToggleTheme={() =>
            setPreferences((p) => ({
              ...p,
              theme: p.theme === 'light' ? 'dark' : 'light',
            }))
          }
          onToggleMusic={handleToggleMusic}
          onProgressChange={handleReaderProgress}
          onToggleBookmark={handleToggleBookmark}
          onRemoveBookmark={handleRemoveBookmark}
          onAddHighlight={handleAddHighlight}
          onRemoveHighlight={handleRemoveHighlight}
          onClearAnnotations={handleClearAnnotations}
          onClose={() => setReadingBook(null)}
        />
      )}

      {personalOpen && (
        <Suspense fallback={null}>
          <PersonalLibraryOverlay
            books={personalBooks}
            onAddBook={async (rec) => {
              await addPersonalBook(rec);
              setPersonalBooks(await listPersonalBooks());
              showToast(`Đã lưu "${rec.title}" vào thư viện cá nhân.`);
            }}
            onDeleteBook={async (id) => {
              await removePersonalBook(id);
              setPersonalBooks(await listPersonalBooks());
            }}
            onClose={() => setPersonalOpen(false)}
          />
        </Suspense>
      )}

      {backupOpen && (
        <BackupModal
          bookStates={bookStates}
          bookmarks={bookmarks}
          highlights={highlights}
          readingHistory={readingHistory}
          preferences={preferences}
          onApplyRestore={handleApplyRestore}
          onClose={() => setBackupOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
