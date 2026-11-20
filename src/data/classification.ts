import type { SpinePalette } from './types';

const VIETNAMESE_LITERATURE_AUTHORS = new Set([
  'Đoàn Giỏi',
  'Hàn Mạc Tử',
  'Hoài Thanh & Hoài Chân',
  'Kim Lân',
  'Nam Cao',
  'Ngô Tất Tố',
  'Nguyễn Ngọc Thuần',
  'Phạm Lữ Ân',
  'Phùng Quán',
  'Sơn Tùng',
  'Thạch Lam',
  'Thích Nhất Hạnh',
  'Tô Hoài',
  'Vũ Bằng',
  'Vũ Trọng Phụng',
]);

export const CATEGORY_GROUP_ORDER = [
  'Nguyễn Nhật Ánh',
  'Văn học Việt Nam',
  'Văn học nước ngoài',
];

/** Curated editorial literary cover/spine palettes with strong contrast. */
const SPINE_PALETTES: SpinePalette[] = [
  { bg: '#1F3FB0', bgDark: '#162C7A', text: '#F7F4EC', accent: '#E8C56D' },
  { bg: '#2B4C3B', bgDark: '#1D3328', text: '#F5F2E8', accent: '#D8B467' },
  { bg: '#7A2E2E', bgDark: '#561E1E', text: '#F9F3EC', accent: '#E5C483' },
  { bg: '#374151', bgDark: '#1F2937', text: '#F3F4F6', accent: '#D9A75A' },
  { bg: '#8C5327', bgDark: '#633818', text: '#FAF4EB', accent: '#F2D69A' },
  { bg: '#284B63', bgDark: '#1B3445', text: '#F3F6F8', accent: '#DFBE74' },
  { bg: '#5B3758', bgDark: '#3E233C', text: '#F8F2F6', accent: '#E4C08A' },
  { bg: '#4E5D38', bgDark: '#344024', text: '#F5F6EE', accent: '#DFCA78' },
  { bg: '#DFD6C5', bgDark: '#C8BCA8', text: '#1C1B18', accent: '#1F3FB0' },
  { bg: '#9B4D3A', bgDark: '#6E3325', text: '#FAF3ED', accent: '#F0CFA0' },
  { bg: '#274E56', bgDark: '#1A363B', text: '#F0F6F6', accent: '#D6B975' },
  { bg: '#5C4438', bgDark: '#3F2E25', text: '#F7F1EA', accent: '#E0BE7D' },
];

export interface ParsedBookHeader {
  numericId: number;
  title: string;
  author: string;
}

/**
 * Parse `=== SÁCH [<id>]: <Title> (<Author>) ===` using balanced right-to-left
 * parenthesis matching so nested parentheses like `(Alexandre Dumas (con))` parse cleanly.
 */
export function parseBookHeader(
  firstLine: string,
  fallbackId = 0,
  fallbackTitle = 'Không rõ tiêu đề',
): ParsedBookHeader {
  const cleaned = firstLine.trim();
  const match = cleaned.match(/^=== SÁCH \[(\d+)\]: (.+) ===$/);
  if (!match) {
    return { numericId: fallbackId, title: fallbackTitle, author: 'Khuyết danh' };
  }

  const numericId = Number(match[1]);
  const rest = match[2].trim();

  if (rest.endsWith(')')) {
    let depth = 0;
    let splitIdx = -1;
    for (let i = rest.length - 1; i >= 0; i--) {
      if (rest[i] === ')') depth++;
      else if (rest[i] === '(') {
        depth--;
        if (depth === 0) {
          splitIdx = i;
          break;
        }
      }
    }
    if (splitIdx > 0) {
      return {
        numericId,
        title: rest.slice(0, splitIdx).trim(),
        author: rest.slice(splitIdx + 1, -1).trim() || 'Khuyết danh',
      };
    }
  }

  return { numericId, title: rest, author: 'Khuyết danh' };
}

/** Map an author into one of the primary bookshelf category groups. */
export function classifyCategoryGroup(author: string): string {
  if (author === 'Nguyễn Nhật Ánh') return 'Nguyễn Nhật Ánh';
  if (VIETNAMESE_LITERATURE_AUTHORS.has(author)) return 'Văn học Việt Nam';
  return 'Văn học nước ngoài';
}

/** Infer a clean literary genre label from book title and author without fabricating facts. */
export function inferGenre(title: string, author: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('thơ điên') || lower.includes('thi nhân')) return 'Thơ & Phê bình';
  if (lower.includes('truyện ngắn') || lower === 'chí phèo' || lower === 'lão hạc' || lower === 'vợ nhặt') {
    return 'Truyện ngắn';
  }
  if (lower.includes('ghi chép pháp y')) return 'Ký sự pháp y';
  if (
    lower.includes('harry potter') ||
    lower.includes('đoàn hộ nhẫn') ||
    lower.includes('hai tòa tháp') ||
    lower.includes('nhà vua trở về') ||
    lower.includes('phù thủy xứ oz') ||
    lower.includes('langbiang')
  ) {
    return 'Giả tưởng';
  }
  if (
    lower.includes('mindset') ||
    lower.includes('thiên tài bên trái') ||
    lower.includes('anh là ai, tôi là ai') ||
    lower.includes('nếu biết trăm năm')
  ) {
    return 'Tâm lý & Triết lý';
  }
  if (
    lower.includes('bạch dạ hành') ||
    lower.includes('nghi can x') ||
    lower.includes('ác ý') ||
    lower.includes('ảo dạ') ||
    lower.includes('sherlock holmes') ||
    lower.includes('sự im lặng của bầy cừu') ||
    lower.includes('ngôi nhà kỳ quái')
  ) {
    return 'Trinh thám & Tâm lý';
  }
  if (
    author === 'Nguyễn Nhật Ánh' ||
    lower.includes('dế mèn') ||
    lower.includes('hoàng tử bé') ||
    lower.includes('totto-chan') ||
    lower.includes('anne ') ||
    lower.includes('thung lũng cầu vồng') ||
    lower.includes('rilla dưới mái nhà')
  ) {
    return 'Truyện dài & Tuổi trẻ';
  }
  if (lower.includes('truyện kiều') || lower.includes('thương nhớ mười hai') || lower.includes('hà nội băm sáu')) {
    return 'Tản văn & Kinh điển';
  }
  return 'Tiểu thuyết';
}

/** Deterministic curated spine palette based on book ID and group. */
export function getSpinePalette(numericId: number, categoryGroup: string): SpinePalette {
  const offset =
    categoryGroup === 'Nguyễn Nhật Ánh'
      ? 0
      : categoryGroup === 'Văn học Việt Nam'
        ? 4
        : 7;
  return SPINE_PALETTES[(Math.abs(numericId) + offset) % SPINE_PALETTES.length];
}
