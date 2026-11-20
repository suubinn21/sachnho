import type {
  BackupPayload,
  BookmarkItem,
  HighlightItem,
  ReadingHistoryItem,
  UserBookState,
  UserPreferences,
} from '../data/types';

/** Create a versioned JSON backup object from current client state. */
export function buildBackupPayload(data: {
  bookStates: Record<string, UserBookState>;
  bookmarks: Record<string, BookmarkItem[]>;
  highlights: Record<string, HighlightItem[]>;
  readingHistory: ReadingHistoryItem[];
  preferences: UserPreferences;
}): BackupPayload {
  return {
    app: 'sach-cua-dang',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  };
}

/** Validate parsed JSON before applying backup restore. */
export function parseAndValidateBackup(rawJson: string): BackupPayload {
  const parsed = JSON.parse(rawJson) as Partial<BackupPayload>;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Tệp sao lưu không hợp lệ.');
  }
  if (parsed.app !== 'sach-cua-dang' || parsed.schemaVersion !== 1) {
    throw new Error('Định dạng hoặc phiên bản sao lưu không khớp với Sách của Đăng.');
  }
  if (
    typeof parsed.bookStates !== 'object' ||
    typeof parsed.bookmarks !== 'object' ||
    typeof parsed.highlights !== 'object' ||
    !Array.isArray(parsed.readingHistory)
  ) {
    throw new Error('Dữ liệu trong tệp sao lưu bị thiếu trường bắt buộc.');
  }
  return parsed as BackupPayload;
}

function dedupeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of existing) map.set(item.id, item);
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()];
}

/** Smartly merge incoming backup with current state using newest timestamps. */
export function mergeBackupData(
  current: Omit<BackupPayload, 'app' | 'schemaVersion' | 'exportedAt'>,
  incoming: BackupPayload,
): Omit<BackupPayload, 'app' | 'schemaVersion' | 'exportedAt'> {
  const mergedStates: Record<string, UserBookState> = { ...current.bookStates };
  for (const [bookId, incState] of Object.entries(incoming.bookStates)) {
    const curState = mergedStates[bookId];
    if (!curState) {
      mergedStates[bookId] = incState;
      continue;
    }
    const curTime = curState.lastOpenedAt ? Date.parse(curState.lastOpenedAt) : 0;
    const incTime = incState.lastOpenedAt ? Date.parse(incState.lastOpenedAt) : 0;
    mergedStates[bookId] = incTime >= curTime ? { ...curState, ...incState } : { ...incState, ...curState };
  }

  const mergedBookmarks: Record<string, BookmarkItem[]> = { ...current.bookmarks };
  for (const [bookId, list] of Object.entries(incoming.bookmarks)) {
    mergedBookmarks[bookId] = dedupeById(mergedBookmarks[bookId] ?? [], list);
  }

  const mergedHighlights: Record<string, HighlightItem[]> = { ...current.highlights };
  for (const [bookId, list] of Object.entries(incoming.highlights)) {
    mergedHighlights[bookId] = dedupeById(mergedHighlights[bookId] ?? [], list);
  }

  const historyMap = new Map<string, ReadingHistoryItem>();
  for (const item of [...current.readingHistory, ...incoming.readingHistory]) {
    const prev = historyMap.get(item.bookId);
    if (!prev || item.openedAt > prev.openedAt) {
      historyMap.set(item.bookId, item);
    }
  }
  const mergedHistory = [...historyMap.values()]
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
    .slice(0, 50);

  return {
    bookStates: mergedStates,
    bookmarks: mergedBookmarks,
    highlights: mergedHighlights,
    readingHistory: mergedHistory,
    preferences: { ...current.preferences, ...incoming.preferences },
  };
}
