import { parseBookHeader } from './classification';
import type { BookChapter, BookContent } from './types';

const CHAPTER_LINE_RE = /^\[CHƯƠNG\s+(\d+)\s*-\s*rtit\]\s*(.*)$/;

/** Parse a raw `.txt` book file into normalized chapters and paragraphs. */
export function parseBookTxtContent(
  rawText: string,
  bookId: string,
  options?: { isPoetry?: boolean },
): BookContent {
  const lines = rawText.split(/\r?\n/);
  const headerInfo = parseBookHeader(lines[0] ?? '', 0, bookId);
  const isPoetry = options?.isPoetry ?? headerInfo.numericId === 36;

  const chapters: BookChapter[] = [];
  let currentTitle = '';
  let currentOrder = 0;
  let collectingBody = false;
  let currentParagraphs: string[] = [];

  const flushChapter = () => {
    if (!currentTitle && currentParagraphs.length === 0) return;
    const orderIndex = currentOrder || chapters.length + 1;
    chapters.push({
      id: `${bookId}-ch-${orderIndex}`,
      orderIndex,
      title: currentTitle || `Chương ${orderIndex}`,
      paragraphs: currentParagraphs,
      isPoetry,
    });
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const chMatch = line.match(CHAPTER_LINE_RE);
    if (chMatch) {
      flushChapter();
      currentOrder = Number(chMatch[1]);
      currentTitle = chMatch[2].trim() || `Chương ${currentOrder}`;
      currentParagraphs = [];
      collectingBody = false;
      continue;
    }

    const trimmed = line.trim();
    if (!collectingBody && trimmed === '[rtx]') {
      collectingBody = true;
      continue;
    }

    if (!trimmed) continue;

    if (collectingBody || chapters.length === 0) {
      currentParagraphs.push(trimmed);
    }
  }

  flushChapter();

  // Fallback for plain .txt files without [CHƯƠNG ...] markers
  if (chapters.length === 0) {
    const fallbackParagraphs = lines
      .slice(1)
      .map((l) => l.trim())
      .filter(Boolean);
    if (fallbackParagraphs.length > 0) {
      chapters.push({
        id: `${bookId}-ch-1`,
        orderIndex: 1,
        title: 'Nội dung',
        paragraphs: fallbackParagraphs,
        isPoetry,
      });
    }
  }

  return { bookId, chapters };
}
