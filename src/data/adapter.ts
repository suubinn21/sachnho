import { booksCatalog } from 'virtual:books-catalog';
import { CATEGORY_GROUP_ORDER } from './classification';
import { parseBookTxtContent } from './txtParser';
import type { BookContent, BookMeta } from './types';

const rawBookUrls = import.meta.glob('./raw/*.txt', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const coverImageUrls = import.meta.glob('./covers/*.{jpg,jpeg,png,webp}', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const normalizedCoverUrls = new Map<string, string>(
  Object.entries(coverImageUrls).map(([k, v]) => [k.normalize('NFC'), v]),
);

const contentCache = new Map<string, BookContent>();

function resolveCoverUrl(book: BookMeta): string | undefined {
  if (book.coverUrl) return book.coverUrl;
  const rawBase = book.contentRef
    .replace(/^\.\/raw\//, '')
    .replace(/\.txt$/i, '')
    .normalize('NFC');
  const candidates = [
    `./covers/${rawBase}.webp`,
    `./covers/${rawBase}.jpg`,
    `./covers/${rawBase}.jpeg`,
    `./covers/${rawBase}.png`,
    `./covers/${book.id}.webp`,
    `./covers/${book.id}.jpg`,
    `./covers/${book.id}.jpeg`,
    `./covers/${book.id}.png`,
    `./covers/${book.numericId}.webp`,
    `./covers/${book.numericId}.jpg`,
    `./covers/${book.numericId}.jpeg`,
    `./covers/${book.numericId}.png`,
  ];
  for (const key of candidates) {
    const hit = normalizedCoverUrls.get(key.normalize('NFC'));
    if (hit) return hit;
  }
  return undefined;
}

const normalizedCatalog: BookMeta[] = booksCatalog.map((book) => ({
  ...book,
  coverUrl: resolveCoverUrl(book),
}));

const booksById = new Map<string, BookMeta>(
  normalizedCatalog.map((b) => [b.id, b]),
);

/** Return all normalized books loaded statically from `src/data/raw/*.txt`. */
export function getCatalog(): BookMeta[] {
  return normalizedCatalog;
}

/** Look up a single book's metadata by ID. */
export function getBookById(bookId: string): BookMeta | undefined {
  return booksById.get(bookId);
}

/** Derive ordered unique category group tabs directly from catalog data. */
export function getCategoryGroups(books: BookMeta[]): string[] {
  const existing = new Set(books.map((b) => b.categoryGroup));
  const ordered = CATEGORY_GROUP_ORDER.filter((g) => existing.has(g));
  const extras = [...existing]
    .filter((g) => !CATEGORY_GROUP_ORDER.includes(g))
    .sort((a, b) => a.localeCompare(b, 'vi'));
  return [...ordered, ...extras];
}

/** Lazy-load and parse a book's `.txt` file only when the user opens the reader. */
export async function loadBookContent(bookId: string): Promise<BookContent> {
  const cached = contentCache.get(bookId);
  if (cached) return cached;

  const meta = booksById.get(bookId);
  if (!meta) {
    throw new Error(`Không tìm thấy sách với mã "${bookId}".`);
  }

  const assetUrl = rawBookUrls[meta.contentRef];
  if (!assetUrl) {
    throw new Error(`Không tìm thấy tệp nội dung cho "${meta.title}".`);
  }

  const resp = await fetch(assetUrl);
  if (!resp.ok) {
    throw new Error(`Không thể tải nội dung sách "${meta.title}" (${resp.status}).`);
  }

  const rawText = await resp.text();
  const parsed = parseBookTxtContent(rawText, bookId, { isPoetry: meta.isPoetry });
  contentCache.set(bookId, parsed);
  return parsed;
}
