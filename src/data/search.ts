import type { BookMeta } from './types';

/** Strip Vietnamese accents and fold case for resilient search matching. */
export function stripVietnameseDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Build combined searchable string for a book's metadata. */
export function buildSearchText(
  title: string,
  author: string,
  genre: string,
  categoryGroup: string,
): string {
  return stripVietnameseDiacritics(`${title} ${author} ${genre} ${categoryGroup}`);
}

/** Return up to `limit` books matching query, ranking prefix/title hits higher. */
export function searchBooks(
  books: BookMeta[],
  rawQuery: string,
  limit = 6,
): BookMeta[] {
  const needle = stripVietnameseDiacritics(rawQuery);
  if (!needle) return [];

  const tokens = needle.split(/\s+/).filter(Boolean);
  const scored: Array<{ book: BookMeta; score: number }> = [];

  for (const book of books) {
    if (!tokens.every((t) => book.searchText.includes(t))) continue;

    const normTitle = stripVietnameseDiacritics(book.title);
    const normAuthor = stripVietnameseDiacritics(book.author);
    let score = 1;
    if (normTitle === needle) score += 100;
    else if (normTitle.startsWith(needle)) score += 60;
    else if (normTitle.includes(needle)) score += 35;
    else if (normAuthor.includes(needle)) score += 15;

    scored.push({ book, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.book.title.localeCompare(b.book.title, 'vi');
  });

  return scored.slice(0, limit).map((item) => item.book);
}
