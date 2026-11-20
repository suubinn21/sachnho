import type { BookContent } from '../data/types';

export interface ReaderParagraphBlock {
  chapterId: string;
  chapterTitle: string;
  paragraphIndex: number;
  text: string;
  isChapterStart: boolean;
  isPoetry?: boolean;
}

export interface ReaderPage {
  pageNumber: number; // 1-based; 1 = Intro/Synopsis, 2 = Table of Contents, 3+ = Book text
  kind: 'intro' | 'toc' | 'content';
  blocks: ReaderParagraphBlock[];
  wordCount: number;
}

export interface PaginatedBook {
  pages: ReaderPage[];
  chapterStartPages: Record<string, number>;
  totalWords: number;
}

const CHAR_BUDGET_PROSE = 1280;
const LINE_BUDGET_POETRY = 16;

function splitLongParagraph(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    if (cursor + maxChars >= text.length) {
      chunks.push(text.slice(cursor).trim());
      break;
    }
    const windowStr = text.slice(cursor, cursor + maxChars);
    let cut = Math.max(windowStr.lastIndexOf('. '), windowStr.lastIndexOf('! '), windowStr.lastIndexOf('? '));
    if (cut < maxChars * 0.45) {
      cut = windowStr.lastIndexOf(' ');
    }
    if (cut <= 0) cut = maxChars;
    else cut += 1;

    chunks.push(text.slice(cursor, cursor + cut).trim());
    cursor += cut;
  }
  return chunks.filter(Boolean);
}

/**
 * Paginate book chapters into stable reader pages starting at page 3
 * (page 1 = Book Overview, page 2 = Table of Contents).
 */
export function paginateBookContent(content: BookContent): PaginatedBook {
  const pages: ReaderPage[] = [
    { pageNumber: 1, kind: 'intro', blocks: [], wordCount: 0 },
    { pageNumber: 2, kind: 'toc', blocks: [], wordCount: 0 },
  ];

  const chapterStartPages: Record<string, number> = {};
  let totalWords = 0;
  let currentBlocks: ReaderParagraphBlock[] = [];
  let currentChars = 0;
  let currentLines = 0;
  let currentWords = 0;

  const pushCurrentPage = () => {
    if (currentBlocks.length === 0) return;
    pages.push({
      pageNumber: pages.length + 1,
      kind: 'content',
      blocks: currentBlocks,
      wordCount: currentWords,
    });
    currentBlocks = [];
    currentChars = 0;
    currentLines = 0;
    currentWords = 0;
  };

  for (const chapter of content.chapters) {
    // Always start each chapter cleanly on a new page for crisp reading structure
    pushCurrentPage();
    chapterStartPages[chapter.id] = pages.length + 1;

    const isPoetry = Boolean(chapter.isPoetry);
    const expandedParagraphs: string[] = [];
    for (const para of chapter.paragraphs) {
      if (isPoetry) {
        expandedParagraphs.push(para);
      } else {
        expandedParagraphs.push(...splitLongParagraph(para, 950));
      }
    }

    expandedParagraphs.forEach((para, idx) => {
      const words = para.split(/\s+/).filter(Boolean).length;
      totalWords += words;
      const isChapterStart = idx === 0;
      const extraWeight = isChapterStart ? 180 : 0;

      const exceedsProse = !isPoetry && currentBlocks.length > 0 && currentChars + para.length + extraWeight > CHAR_BUDGET_PROSE;
      const exceedsPoetry = isPoetry && currentBlocks.length > 0 && currentLines >= LINE_BUDGET_POETRY;

      if (exceedsProse || exceedsPoetry) {
        pushCurrentPage();
      }

      currentBlocks.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        paragraphIndex: idx,
        text: para,
        isChapterStart,
        isPoetry,
      });
      currentChars += para.length + extraWeight;
      currentLines += 1;
      currentWords += words;
    });
  }

  pushCurrentPage();

  return { pages, chapterStartPages, totalWords };
}

/** Estimate remaining reading time based on ~250 words per minute. */
export function formatRemainingTime(remainingWords: number): string {
  const minutes = Math.max(1, Math.round(remainingWords / 250));
  if (minutes < 60) return `còn ~${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `còn ~${hours} giờ ${mins} phút` : `còn ~${hours} giờ`;
}
