import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { classifyCategoryGroup, parseBookHeader } from '../classification';
import { DEFAULT_FILTERS, filterBooks } from '../filters';
import { buildSearchText, searchBooks } from '../search';
import { parseBookTxtContent } from '../txtParser';
import { ALL_FILTER_VALUE, type BookMeta } from '../types';
import { paginateBookContent } from '../../utils/pagination';
import {
  buildBackupPayload,
  mergeBackupData,
  parseAndValidateBackup,
} from '../../storage/backup';

const RAW_DIR = path.resolve(process.cwd(), 'src/data/raw');
const COVERS_DIR = path.resolve(process.cwd(), 'src/data/covers');

function makeMeta(overrides: Partial<BookMeta>): BookMeta {
  const title = overrides.title ?? 'Mắt biếc';
  const author = overrides.author ?? 'Nguyễn Nhật Ánh';
  const genre = overrides.genre ?? 'Truyện dài & Tuổi trẻ';
  const categoryGroup = overrides.categoryGroup ?? classifyCategoryGroup(author);
  return {
    id: overrides.id ?? 'book-18',
    numericId: overrides.numericId ?? 18,
    title,
    author,
    year: overrides.year ?? null,
    categoryGroup,
    genre,
    format: '10 chương',
    spinePalette: { bg: '#1F3FB0', bgDark: '#162C7A', text: '#fff', accent: '#E8C56D' },
    synopsis: '',
    chapterCount: 10,
    wordCount: 40000,
    estimatedPages: 150,
    contentRef: './raw/Mat biec.txt',
    searchText: buildSearchText(title, author, genre, categoryGroup),
    ...overrides,
  };
}

describe('Real 140-book dataset integrity', () => {
  it('parses all 140 raw .txt files cleanly into 40 NNA + 18 VN + 82 Foreign', () => {
    const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.txt'));
    expect(files.length).toBe(140);

    const groupCounts: Record<string, number> = {};
    const ids = new Set<number>();

    for (const file of files) {
      const fd = fs.openSync(path.join(RAW_DIR, file), 'r');
      const buf = Buffer.alloc(512);
      const bytesRead = fs.readSync(fd, buf, 0, buf.length, 0);
      fs.closeSync(fd);
      const firstLine = buf.toString('utf8', 0, bytesRead).split(/\r?\n/)[0];
      const header = parseBookHeader(firstLine);
      expect(header.author).not.toBe('Khuyết danh');
      ids.add(header.numericId);
      const grp = classifyCategoryGroup(header.author);
      groupCounts[grp] = (groupCounts[grp] ?? 0) + 1;
    }

    expect(ids.size).toBe(140);
    expect(groupCounts['Nguyễn Nhật Ánh']).toBe(40);
    expect(groupCounts['Văn học Việt Nam']).toBe(18);
    expect(groupCounts['Văn học nước ngoài']).toBe(82);

    const coverFiles = fs.readdirSync(COVERS_DIR);
    const coverBases = new Set(
      coverFiles.map((f) => f.replace(/\.(jpg|jpeg|png|webp)$/i, '').normalize('NFC')),
    );
    for (const file of files) {
      const base = file.replace(/\.txt$/i, '').normalize('NFC');
      expect(coverBases.has(base), `Missing cover for ${file}`).toBe(true);
    }
  });

  it('handles nested parentheses in author name like Alexandre Dumas (con)', () => {
    const parsed = parseBookHeader(
      '=== SÁCH [91]: Trà hoa nữ (Alexandre Dumas (con)) ===',
    );
    expect(parsed.numericId).toBe(91);
    expect(parsed.title).toBe('Trà hoa nữ');
    expect(parsed.author).toBe('Alexandre Dumas (con)');
  });

  it('parses prose and poetry .txt files into paginated chapters', () => {
    const gatsbyRaw = fs.readFileSync(path.join(RAW_DIR, 'Gatsby Vĩ Đại.txt'), 'utf8');
    const gatsbyContent = parseBookTxtContent(gatsbyRaw, 'book-125');
    expect(gatsbyContent.chapters.length).toBeGreaterThan(5);
    expect(gatsbyContent.chapters[0].paragraphs.length).toBeGreaterThan(5);

    const paginated = paginateBookContent(gatsbyContent, {
      leafWidth: 400,
      leafHeight: 480,
      zoom: 100,
    });
    expect(paginated.pages[0].kind).toBe('intro');
    expect(paginated.pages[1].kind).toBe('toc');
    expect(paginated.pages.length).toBeGreaterThan(10);

    const zoomedOut = paginateBookContent(gatsbyContent, {
      leafWidth: 400,
      leafHeight: 480,
      zoom: 200,
    });
    expect(zoomedOut.pages.length).toBeGreaterThan(paginated.pages.length);
    const hasSplitParagraph = zoomedOut.pages.some((p) =>
      p.blocks.some((b) => b.isContinuation),
    );
    expect(hasSplitParagraph).toBe(true);

    const thoDienRaw = fs.readFileSync(path.join(RAW_DIR, 'Thơ điên.txt'), 'utf8');
    const thoDien = parseBookTxtContent(thoDienRaw, 'book-36', { isPoetry: true });
    expect(thoDien.chapters[0].isPoetry).toBe(true);
    expect(thoDien.chapters[0].paragraphs.length).toBeGreaterThan(10);
  });
});

describe('Search, Filter & Backup contracts', () => {
  const sampleBooks = [
    makeMeta({ id: 'book-18', numericId: 18, title: 'Mắt biếc', author: 'Nguyễn Nhật Ánh' }),
    makeMeta({ id: 'book-9', numericId: 9, title: 'Tôi thấy hoa vàng trên cỏ xanh', author: 'Nguyễn Nhật Ánh' }),
    makeMeta({ id: 'book-77', numericId: 77, title: 'Chí Phèo', author: 'Nam Cao', genre: 'Truyện ngắn' }),
    makeMeta({ id: 'book-125', numericId: 125, title: 'Gatsby Vĩ Đại', author: 'F. Scott Fitzgerald', genre: 'Tiểu thuyết' }),
    makeMeta({ id: 'book-126', numericId: 126, title: 'Kiêu hãnh và định kiến', author: 'Jane Austen', genre: 'Tiểu thuyết' }),
    makeMeta({ id: 'book-127', numericId: 127, title: 'Những người khốn khổ', author: 'Victor Hugo', genre: 'Tiểu thuyết' }),
    makeMeta({ id: 'book-55', numericId: 55, title: 'Hoàng tử bé', author: 'Antoine de Saint-Exupéry', genre: 'Truyện dài & Tuổi trẻ' }),
  ];

  it('supports diacritic-insensitive Vietnamese search and limits to 6 results', () => {
    const hits = searchBooks(sampleBooks, 'mat biec', 6);
    expect(hits.map((b) => b.id)).toEqual(['book-18']);

    const wide = searchBooks(sampleBooks, 'a', 6);
    expect(wide.length).toBeLessThanOrEqual(6);
  });

  it('returns all books when dropdowns reset to ALL_FILTER_VALUE (fixes 0/128 bug)', () => {
    const res = filterBooks(
      sampleBooks,
      { ...DEFAULT_FILTERS, categoryGroup: ALL_FILTER_VALUE },
      {},
    );
    expect(res.length).toBe(sampleBooks.length);

    const statusFiltered = filterBooks(
      sampleBooks,
      { ...DEFAULT_FILTERS, status: 'read' },
      { 'book-18': { status: 'read', rating: 5 } },
    );
    expect(statusFiltered.map((b) => b.id)).toEqual(['book-18']);
  });

  it('validates and smartly merges JSON backups', () => {
    const payload = buildBackupPayload({
      bookStates: { 'book-18': { status: 'read', rating: 5, lastPage: 42, lastOpenedAt: '2026-11-20T10:00:00Z' } },
      bookmarks: { 'book-18': [{ id: 'bm1', pageNumber: 12, createdAt: '2026-11-20T10:00:00Z' }] },
      highlights: {},
      readingHistory: [{ bookId: 'book-18', openedAt: '2026-11-20T10:00:00Z', lastPage: 42 }],
      preferences: { theme: 'dark', readerZoom: 115, activeCategory: 'Tất cả' },
    });

    const parsed = parseAndValidateBackup(JSON.stringify(payload));
    expect(parsed.app).toBe('sach-cua-dang');

    const merged = mergeBackupData(
      {
        bookStates: { 'book-9': { status: 'reading', lastPage: 8, lastOpenedAt: '2026-11-19T10:00:00Z' } },
        bookmarks: {},
        highlights: {},
        readingHistory: [],
        preferences: { theme: 'light', readerZoom: 100, activeCategory: 'Tất cả' },
      },
      parsed,
    );

    expect(merged.bookStates['book-18']?.rating).toBe(5);
    expect(merged.bookStates['book-9']?.lastPage).toBe(8);
    expect(merged.bookmarks['book-18']?.length).toBe(1);
  });
});
