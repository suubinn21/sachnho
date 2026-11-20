export const ALL_FILTER_VALUE = '__ALL__' as const;
export const PERSONAL_TAB_ID = '__PERSONAL__' as const;

export type ReadingStatus = 'want' | 'reading' | 'read';

export type ThemeMode = 'light' | 'dark';

export interface SpinePalette {
  bg: string;
  bgDark: string;
  text: string;
  accent: string;
}

export interface BookMeta {
  id: string;
  numericId: number;
  title: string;
  author: string;
  year: number | null;
  categoryGroup: string;
  genre: string;
  format: string;
  coverUrl?: string;
  spinePalette: SpinePalette;
  synopsis: string;
  chapterCount: number;
  wordCount: number;
  estimatedPages: number;
  isNew?: boolean;
  isPoetry?: boolean;
  contentRef: string;
  searchText: string;
}

export interface BookChapter {
  id: string;
  orderIndex: number;
  title: string;
  paragraphs: string[];
  isPoetry?: boolean;
}

export interface BookContent {
  bookId: string;
  chapters: BookChapter[];
}

export interface UserBookState {
  status?: ReadingStatus;
  rating?: 1 | 2 | 3 | 4 | 5;
  lastPage?: number;
  lastOpenedAt?: string;
}

export interface BookmarkItem {
  id: string;
  pageNumber: number;
  chapterTitle?: string;
  createdAt: string;
}

export interface HighlightItem {
  id: string;
  pageNumber: number;
  chapterId?: string;
  paragraphIndex?: number;
  selectedText: string;
  color: HighlightColorKey;
  chapterTitle?: string;
  createdAt: string;
}

export type HighlightColorKey = 'amber' | 'mint' | 'sky' | 'rose';

export interface ReadingHistoryItem {
  bookId: string;
  openedAt: string;
  lastPage: number;
}

export interface UserPreferences {
  theme: ThemeMode;
  readerZoom: number;
  activeCategory: string;
  musicVolume?: number;
}

export interface PersonalBookRecord {
  id: string;
  title: string;
  author: string;
  pdfBlob: Blob;
  coverBlob?: Blob;
  fileSize: number;
  addedAt: string;
}

export interface PersonalTrackRecord {
  id: string;
  title: string;
  bpm: number;
  audioBlob: Blob;
  addedAt: string;
}

export interface AudioTrackItem {
  id: string;
  title: string;
  bpm: number;
  sourceType: 'synth' | 'static-file' | 'local-mp3';
  presetIndex?: number;
  url?: string;
}

export interface FilterCriteria {
  status: 'all' | ReadingStatus | 'unmarked';
  genre: string;
  author: string;
  categoryGroup: string;
  yearFrom: string;
  yearTo: string;
}

export interface BackupPayload {
  app: 'sach-cua-dang';
  schemaVersion: 1;
  exportedAt: string;
  bookStates: Record<string, UserBookState>;
  bookmarks: Record<string, BookmarkItem[]>;
  highlights: Record<string, HighlightItem[]>;
  readingHistory: ReadingHistoryItem[];
  preferences: UserPreferences;
}

export interface SiteConfig {
  appTitle: string;
  appSubtitle: string;
  footerNote: string;
  personalTabLabel: string;
  defaultAudioTracks: AudioTrackItem[];
}
