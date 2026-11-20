import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import {
  classifyCategoryGroup,
  getSpinePalette,
  inferGenre,
  parseBookHeader,
} from '../src/data/classification';
import { buildSearchText } from '../src/data/search';
import type { BookMeta } from '../src/data/types';

const VIRTUAL_ID = 'virtual:books-catalog';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

const CHAPTER_RE = /^\[CHƯƠNG\s+\d+\s*-\s*rtit\]/;

function buildExcerpt(lines: string[]): string {
  const collected: string[] = [];
  let inBody = false;

  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (CHAPTER_RE.test(trimmed)) {
      if (collected.length > 0) break;
      continue;
    }
    if (trimmed === '[rtx]') {
      inBody = true;
      continue;
    }
    if (!inBody) continue;
    if (trimmed === 'GIỚI THIỆU TÁC GIẢ' || /^I+\.\s+/.test(trimmed)) continue;

    collected.push(trimmed);
    if (collected.join(' ').length >= 260) break;
  }

  const raw = collected.join(' ').replace(/\s+/g, ' ').trim();
  if (raw.length <= 240) return raw;
  const slice = raw.slice(0, 240);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > 120 ? slice.slice(0, lastSpace) : slice).trim()}…`;
}

function scanBookTxtFile(filePath: string, fileName: string, fallbackIdx: number): BookMeta {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const fallbackTitle = fileName.replace(/\.txt$/i, '');
  const header = parseBookHeader(lines[0] ?? '', fallbackIdx, fallbackTitle);

  let chapterCount = 0;
  let wordCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (CHAPTER_RE.test(line)) {
      chapterCount++;
    } else if (line.trim() && line.trim() !== '[rtx]') {
      wordCount += line.trim().split(/\s+/).length;
    }
  }

  const categoryGroup = classifyCategoryGroup(header.author);
  const genre = inferGenre(header.title, header.author);
  const id = `book-${header.numericId}`;
  const isPoetry = header.numericId === 36 || genre === 'Thơ & Phê bình';

  return {
    id,
    numericId: header.numericId,
    title: header.title,
    author: header.author,
    year: null,
    categoryGroup,
    genre,
    format: `${Math.max(1, chapterCount)} chương`,
    spinePalette: getSpinePalette(header.numericId, categoryGroup),
    synopsis: buildExcerpt(lines),
    chapterCount: Math.max(1, chapterCount),
    wordCount,
    estimatedPages: Math.max(1, Math.ceil(wordCount / 260)),
    isNew: false,
    isPoetry,
    contentRef: `./raw/${fileName}`,
    searchText: buildSearchText(header.title, header.author, genre, categoryGroup),
  };
}

function scanCatalog(rawDir: string): BookMeta[] {
  if (!fs.existsSync(rawDir)) return [];
  const files = fs
    .readdirSync(rawDir)
    .filter((name) => name.toLowerCase().endsWith('.txt'))
    .sort((a, b) => a.localeCompare(b, 'vi'));

  const books = files.map((fileName, idx) =>
    scanBookTxtFile(path.join(rawDir, fileName), fileName, idx),
  );

  books.sort((a, b) => a.numericId - b.numericId);
  return books;
}

/** Vite plugin exposing `virtual:books-catalog` directly from `src/data/raw/*.txt`. */
export function booksTxtCatalogPlugin(): Plugin {
  let rawDir = '';

  return {
    name: 'vite-plugin-books-txt-catalog',
    configResolved(config) {
      rawDir = path.resolve(config.root, 'src/data/raw');
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return null;
      const catalog = scanCatalog(rawDir);
      return `export const booksCatalog = ${JSON.stringify(catalog)};`;
    },
    configureServer(server) {
      if (!fs.existsSync(rawDir)) return;
      server.watcher.add(rawDir);
      const invalidate = (changedPath: string) => {
        if (!changedPath.startsWith(rawDir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('add', invalidate);
      server.watcher.on('unlink', invalidate);
      server.watcher.on('change', invalidate);
    },
  };
}
