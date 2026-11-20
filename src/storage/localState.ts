import type {
  BookmarkItem,
  HighlightItem,
  ReadingHistoryItem,
  UserBookState,
  UserPreferences,
} from '../data/types';

const PREFIX = 'sach_cua_dang_v1:';

const KEYS = {
  bookStates: `${PREFIX}book_states`,
  bookmarks: `${PREFIX}bookmarks`,
  highlights: `${PREFIX}highlights`,
  readingHistory: `${PREFIX}reading_history`,
  preferences: `${PREFIX}preferences`,
} as const;

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  readerZoom: 100,
  activeCategory: 'Tất cả',
};

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota issues silently for lightweight metadata
  }
}

export function loadBookStates(): Record<string, UserBookState> {
  return safeReadJson(KEYS.bookStates, {});
}

export function saveBookStates(states: Record<string, UserBookState>): void {
  safeWriteJson(KEYS.bookStates, states);
}

export function loadBookmarks(): Record<string, BookmarkItem[]> {
  return safeReadJson(KEYS.bookmarks, {});
}

export function saveBookmarks(bookmarks: Record<string, BookmarkItem[]>): void {
  safeWriteJson(KEYS.bookmarks, bookmarks);
}

export function loadHighlights(): Record<string, HighlightItem[]> {
  return safeReadJson(KEYS.highlights, {});
}

export function saveHighlights(highlights: Record<string, HighlightItem[]>): void {
  safeWriteJson(KEYS.highlights, highlights);
}

export function loadReadingHistory(): ReadingHistoryItem[] {
  return safeReadJson(KEYS.readingHistory, []);
}

export function saveReadingHistory(history: ReadingHistoryItem[]): void {
  safeWriteJson(KEYS.readingHistory, history.slice(0, 50));
}

export function loadPreferences(): UserPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...safeReadJson<Partial<UserPreferences>>(KEYS.preferences, {}),
  };
}

export function savePreferences(prefs: UserPreferences): void {
  safeWriteJson(KEYS.preferences, prefs);
}
