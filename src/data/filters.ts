import { ALL_FILTER_VALUE, type BookMeta, type FilterCriteria, type UserBookState } from './types';

export const DEFAULT_FILTERS: FilterCriteria = {
  status: 'all',
  genre: ALL_FILTER_VALUE,
  author: ALL_FILTER_VALUE,
  categoryGroup: ALL_FILTER_VALUE,
  yearFrom: '',
  yearTo: '',
};

/** Count active filter controls so the UI can show a red indicator dot. */
export function isFilterActive(filters: FilterCriteria): boolean {
  return (
    filters.status !== 'all' ||
    filters.genre !== ALL_FILTER_VALUE ||
    filters.author !== ALL_FILTER_VALUE ||
    filters.categoryGroup !== ALL_FILTER_VALUE ||
    filters.yearFrom.trim() !== '' ||
    filters.yearTo.trim() !== ''
  );
}

/** Derive sorted unique authors and genres directly from loaded books. */
export function extractFilterOptions(books: BookMeta[]) {
  const genres = [...new Set(books.map((b) => b.genre).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'vi'),
  );
  const authors = [...new Set(books.map((b) => b.author).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'vi'),
  );
  const hasYears = books.some((b) => b.year !== null);
  return { genres, authors, hasYears };
}

/**
 * Filter catalog books with normalized `__ALL__` values so resetting
 * dropdowns like "Nhóm" to "Mọi nhóm" never drops books to 0.
 */
export function filterBooks(
  books: BookMeta[],
  filters: FilterCriteria,
  bookStates: Record<string, UserBookState>,
): BookMeta[] {
  const yearFromNum = filters.yearFrom.trim() ? Number(filters.yearFrom.trim()) : null;
  const yearToNum = filters.yearTo.trim() ? Number(filters.yearTo.trim()) : null;

  return books.filter((book) => {
    const state = bookStates[book.id];

    if (filters.status === 'unmarked') {
      if (state?.status) return false;
    } else if (filters.status !== 'all') {
      if (state?.status !== filters.status) return false;
    }

    if (filters.genre !== ALL_FILTER_VALUE && book.genre !== filters.genre) {
      return false;
    }

    if (filters.author !== ALL_FILTER_VALUE && book.author !== filters.author) {
      return false;
    }

    if (
      filters.categoryGroup !== ALL_FILTER_VALUE &&
      book.categoryGroup !== filters.categoryGroup
    ) {
      return false;
    }

    if (yearFromNum !== null && !Number.isNaN(yearFromNum)) {
      if (book.year === null || book.year < yearFromNum) return false;
    }

    if (yearToNum !== null && !Number.isNaN(yearToNum)) {
      if (book.year === null || book.year > yearToNum) return false;
    }

    return true;
  });
}

/** Pick one random book from a list, preferring one other than `excludeId` when possible. */
export function pickRandomBook(books: BookMeta[], excludeId?: string): BookMeta | null {
  if (books.length === 0) return null;
  if (books.length === 1) return books[0];
  const pool = excludeId ? books.filter((b) => b.id !== excludeId) : books;
  const target = pool.length > 0 ? pool : books;
  return target[Math.floor(Math.random() * target.length)];
}
