import type { BookContent } from '../data/types';

export interface ReaderParagraphBlock {
  chapterId: string;
  chapterTitle: string;
  paragraphIndex: number;
  text: string;
  isChapterStart: boolean;
  isContinuation?: boolean;
  isPoetry?: boolean;
}

export interface ReaderPage {
  pageNumber: number; // 1-based; 1 = Intro, 2..N = TOC pages, N+1.. = Content pages
  kind: 'intro' | 'toc' | 'content';
  blocks: ReaderParagraphBlock[];
  tocItems?: Array<{ chapterId: string; orderIndex: number; title: string }>;
  wordCount: number;
}

export interface PaginatedBook {
  pages: ReaderPage[];
  chapterStartPages: Record<string, number>;
  tocStartPage: number;
  totalWords: number;
}

export interface PageLayoutOptions {
  /** Inner width in px of a single page leaf body (excluding padding). */
  leafWidth: number;
  /** Inner height in px of a single page leaf body (excluding footer & padding). */
  leafHeight: number;
  /** Zoom percentage (85..250). */
  zoom: number;
  /** Whether the book is poetry (shorter line height, preserves line breaks). */
  isPoetry?: boolean;
}

const DEFAULT_LAYOUT: PageLayoutOptions = {
  leafWidth: 420,
  leafHeight: 520,
  zoom: 100,
  isPoetry: false,
};

type TextMeasurer = (text: string, font: string) => number;

function createTextMeasurer(): TextMeasurer {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const caches = new Map<string, Map<string, number>>();
      return (text: string, font: string) => {
        let fontCache = caches.get(font);
        if (!fontCache) {
          fontCache = new Map();
          caches.set(font, fontCache);
        }
        const cached = fontCache.get(text);
        if (cached !== undefined) return cached;
        if (ctx.font !== font) ctx.font = font;
        const w = ctx.measureText(text).width;
        if (fontCache.size < 60000) fontCache.set(text, w);
        return w;
      };
    }
  }

  // Fallback heuristic for non-DOM environments (Node / Vitest)
  return (text: string, font: string) => {
    const sizeMatch = font.match(/(\d+(?:\.\d+)?)px/);
    const px = sizeMatch ? Number(sizeMatch[1]) : 16;
    return text.length * px * 0.48;
  };
}

/**
 * Wrap a single paragraph into visual lines inside `maxWidth` using `measure`,
 * returning an array of slices (one per line) so we can split mid-paragraph cleanly
 * at exact line boundaries across pages without vertical scrolling.
 */
function wrapParagraphToLines(
  text: string,
  maxWidth: number,
  firstLineIndent: number,
  font: string,
  measure: TextMeasurer,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const spaceW = measure(' ', font);
  const lines: string[] = [];
  let currentLineWords: string[] = [];
  let currentWidth = firstLineIndent;
  let lineIndex = 0;

  for (const word of words) {
    const wordW = measure(word, font);
    const nextW =
      currentLineWords.length === 0
        ? currentWidth + wordW
        : currentWidth + spaceW + wordW;

    if (currentLineWords.length > 0 && nextW > maxWidth) {
      lines.push(currentLineWords.join(' '));
      lineIndex++;
      currentLineWords = [word];
      currentWidth = wordW;
    } else {
      currentLineWords.push(word);
      currentWidth = nextW;
    }

    // Handle extremely long unbroken token on line 0 with indent
    if (currentLineWords.length === 1 && lineIndex === 0 && currentWidth > maxWidth) {
      lines.push(currentLineWords.join(' '));
      lineIndex++;
      currentLineWords = [];
      currentWidth = 0;
    }
  }

  if (currentLineWords.length > 0) {
    lines.push(currentLineWords.join(' '));
  }

  return lines;
}

function estimateChapterHeaderHeight(
  title: string,
  leafWidth: number,
  measure: TextMeasurer,
): number {
  const headingFont = '500 22px "Newsreader", Georgia, serif';
  const lines = wrapParagraphToLines(title, Math.max(120, leafWidth), 0, headingFont, measure);
  const titleLines = Math.max(1, lines.length);
  // Kicker (~18px) + margin + title lines (~29px each) + bottom rule/padding (~26px)
  return 18 + titleLines * 29 + 26;
}

/**
 * Paginate book chapters line-by-line against exact page dimensions and zoom so
 * every page fits completely inside the leaf viewport with zero vertical scrolling,
 * splitting long paragraphs naturally across pages when needed.
 */
export function paginateBookContent(
  content: BookContent,
  layoutOptions?: Partial<PageLayoutOptions>,
): PaginatedBook {
  const opts: PageLayoutOptions = { ...DEFAULT_LAYOUT, ...layoutOptions };
  const leafWidth = Math.max(180, opts.leafWidth);
  // 10px safety buffer prevents subpixel font-metric rounding from triggering scrollbars
  const safeHeight = Math.max(110, opts.leafHeight - 10);
  const fontPx = Math.round((16 * opts.zoom) / 100);
  const isBookPoetry = Boolean(opts.isPoetry);
  const bodyFont = `400 ${fontPx}px "Newsreader", Georgia, serif`;

  const measure = createTextMeasurer();

  const pages: ReaderPage[] = [
    { pageNumber: 1, kind: 'intro', blocks: [], wordCount: 0 },
  ];

  // Paginate Table of Contents across as many pages as needed without overflow
  const tocStartPage = 2;
  const tocHeaderH = 44;
  const tocRowH = 33;
  const maxTocRows = Math.max(4, Math.floor((safeHeight - tocHeaderH) / tocRowH));
  const tocList = content.chapters.map((ch) => ({
    chapterId: ch.id,
    orderIndex: ch.orderIndex,
    title: ch.title,
  }));

  if (tocList.length === 0) {
    pages.push({
      pageNumber: pages.length + 1,
      kind: 'toc',
      blocks: [],
      tocItems: [],
      wordCount: 0,
    });
  } else {
    for (let i = 0; i < tocList.length; i += maxTocRows) {
      pages.push({
        pageNumber: pages.length + 1,
        kind: 'toc',
        blocks: [],
        tocItems: tocList.slice(i, i + maxTocRows),
        wordCount: 0,
      });
    }
  }

  const chapterStartPages: Record<string, number> = {};
  let totalWords = 0;

  let currentBlocks: ReaderParagraphBlock[] = [];
  let usedHeight = 0;
  let currentWords = 0;

  const flushPage = () => {
    if (currentBlocks.length === 0) return;
    pages.push({
      pageNumber: pages.length + 1,
      kind: 'content',
      blocks: currentBlocks,
      wordCount: currentWords,
    });
    currentBlocks = [];
    usedHeight = 0;
    currentWords = 0;
  };

  for (const chapter of content.chapters) {
    flushPage();
    chapterStartPages[chapter.id] = pages.length + 1;

    const isPoetry = Boolean(chapter.isPoetry ?? isBookPoetry);
    const chLineH = Math.ceil(fontPx * (isPoetry ? 1.65 : 1.75));
    const chGap = isPoetry ? 4 : Math.round(fontPx * 0.6);
    const chIndent = isPoetry ? 0 : Math.round(fontPx * 1.25);
    const headerH = estimateChapterHeaderHeight(chapter.title, leafWidth, measure);

    chapter.paragraphs.forEach((rawPara, paraIdx) => {
      const para = rawPara.trim();
      if (!para) return;
      const paraWords = para.split(/\s+/).filter(Boolean).length;
      totalWords += paraWords;

      const lines = wrapParagraphToLines(para, leafWidth, chIndent, bodyFont, measure);
      if (lines.length === 0) return;

      let cursor = 0;
      let needsChapterHeader = paraIdx === 0;

      while (cursor < lines.length) {
        const headingCost = needsChapterHeader ? headerH : 0;
        const availableForLines = safeHeight - usedHeight - headingCost;
        const linesThatFit = Math.floor(availableForLines / chLineH);

        // If not even 1 line fits on current page (and page already has content), flip to next page
        if (linesThatFit <= 0 && currentBlocks.length > 0) {
          flushPage();
          continue;
        }

        // Always take at least 1 line on an empty page to guarantee forward progress
        const takeCount = Math.max(1, Math.min(lines.length - cursor, linesThatFit || 1));
        const sliceText = lines.slice(cursor, cursor + takeCount).join(' ');
        const sliceWords = sliceText.split(/\s+/).filter(Boolean).length;
        const isFirstSlice = cursor === 0;

        currentBlocks.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          paragraphIndex: paraIdx,
          text: sliceText,
          isChapterStart: needsChapterHeader,
          isContinuation: !isFirstSlice,
          isPoetry,
        });

        currentWords += sliceWords;
        usedHeight += headingCost + takeCount * chLineH;
        needsChapterHeader = false;
        cursor += takeCount;

        if (cursor >= lines.length) {
          usedHeight += chGap;
        } else {
          // Remaining lines already fit leafWidth without re-wrapping (O(N) total)
          flushPage();
        }
      }
    });
  }

  flushPage();

  return { pages, chapterStartPages, tocStartPage, totalWords };
}

/** Estimate remaining reading time based on ~250 words per minute. */
export function formatRemainingTime(remainingWords: number): string {
  const minutes = Math.max(1, Math.round(remainingWords / 250));
  if (minutes < 60) return `còn ~${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `còn ~${hours} giờ ${mins} phút` : `còn ~${hours} giờ`;
}
