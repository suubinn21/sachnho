import type { BookMeta, UserBookState } from '../data/types';

interface BookCoverArtProps {
  book: Pick<BookMeta, 'id' | 'numericId' | 'title' | 'author' | 'genre' | 'categoryGroup' | 'coverUrl' | 'spinePalette' | 'chapterCount'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Render real cover image when available, or an editorial hardcover SVG/HTML
 * book cover with paper grain, inner foil frame, and Newsreader typography.
 */
export function BookCoverArt({ book, size = 'lg', className = '' }: BookCoverArtProps) {
  if (book.coverUrl) {
    return (
      <div className={`relative overflow-hidden rounded-md shadow-xl ${className}`}>
        <img
          src={book.coverUrl}
          alt={`Bìa sách ${book.title}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const { bg, bgDark, text, accent } = book.spinePalette;
  const isCompact = size === 'sm';
  const isMedium = size === 'md';

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-r-lg rounded-l-[3px] select-none shadow-[0_18px_38px_-10px_rgba(0,0,0,0.45)] ${className}`}
      style={{
        background: `linear-gradient(145deg, ${bg} 0%, ${bgDark} 100%)`,
        color: text,
      }}
      aria-label={`Bìa minh họa sách ${book.title}`}
    >
      {/* Left spine binding crease */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-3 opacity-35"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(255,255,255,0.22) 55%, rgba(0,0,0,0.18) 100%)',
        }}
      />

      {/* Decorative editorial border frame */}
      <div
        className={`relative flex h-full flex-col justify-between border ${
          isCompact ? 'm-1.5 p-2' : isMedium ? 'm-2.5 p-3' : 'm-3.5 p-5'
        }`}
        style={{ borderColor: `${accent}55` }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`font-sans-ui uppercase tracking-[0.16em] opacity-85 ${
              isCompact ? 'text-[7px]' : isMedium ? 'text-[9px]' : 'text-[10px]'
            }`}
            style={{ color: accent }}
          >
            {book.genre}
          </span>
          {!isCompact && (
            <span
              className="font-sans-ui rounded-full border px-2 py-0.5 text-[9px] font-medium opacity-80"
              style={{ borderColor: `${accent}66`, color: accent }}
            >
              #{book.numericId}
            </span>
          )}
        </div>

        <div className="my-auto py-2 pl-1">
          <div
            className={`mb-2 h-[2px] w-8 rounded-full ${isCompact ? 'w-4 mb-1' : ''}`}
            style={{ backgroundColor: accent }}
          />
          <h3
            className={`font-serif-book font-medium leading-[1.15] tracking-tight ${
              isCompact
                ? 'line-clamp-3 text-[11px]'
                : isMedium
                  ? 'line-clamp-4 text-base'
                  : 'line-clamp-4 text-2xl sm:text-[26px]'
            }`}
          >
            {book.title}
          </h3>
        </div>

        <div className="pl-1">
          <p
            className={`font-sans-ui font-medium opacity-90 ${
              isCompact ? 'truncate text-[8px]' : isMedium ? 'truncate text-[11px]' : 'text-xs'
            }`}
          >
            {book.author}
          </p>
          {!isCompact && (
            <p className="font-sans-ui mt-0.5 text-[10px] opacity-65">
              {book.categoryGroup} · {book.chapterCount} chương
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface BookSpine3DProps {
  book: BookMeta;
  isActive: boolean;
  bookState?: UserBookState;
  onSelectOrOpen: () => void;
}

/**
 * 3D vertical spine card with subtle cover swatch at top, vertical title,
 * author badge, and an angled front-cover reveal when active.
 */
export function BookSpine3D({
  book,
  isActive,
  bookState,
  onSelectOrOpen,
}: BookSpine3DProps) {
  const { bg, bgDark, text, accent } = book.spinePalette;
  const titleLen = book.title.length;
  // Slightly vary height/thickness organically like real printed volumes
  const heightPx = 224 + ((book.numericId * 7) % 28);
  const spineWidth = isActive ? 54 : 44 + (book.wordCount > 180000 ? 8 : 0);

  return (
    <button
      type="button"
      onClick={onSelectOrOpen}
      aria-label={
        isActive
          ? `Mở chi tiết sách ${book.title} của ${book.author}`
          : `Chọn sách ${book.title} trên kệ`
      }
      aria-pressed={isActive}
      className={`group relative shrink-0 cursor-pointer border-0 bg-transparent p-0 text-left outline-none transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-[var(--cobalt)] focus-visible:ring-offset-2 ${
        isActive ? '-translate-y-3 z-20' : 'hover:-translate-y-2 z-10'
      }`}
      style={{
        height: `${heightPx}px`,
        perspective: '1000px',
      }}
    >
      <div
        className="relative flex h-full items-stretch transition-transform duration-300 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: isActive ? 'rotateY(-18deg) scale(1.04)' : 'rotateY(0deg)',
        }}
      >
        {/* Spine surface */}
        <div
          className="relative flex h-full flex-col items-center justify-between overflow-hidden rounded-l-[4px] border-r border-black/25 px-1.5 py-2.5 shadow-[4px_8px_18px_rgba(0,0,0,0.32)]"
          style={{
            width: `${spineWidth}px`,
            background: `linear-gradient(90deg, ${bgDark} 0%, ${bg} 35%, ${bg} 82%, ${bgDark} 100%)`,
            color: text,
          }}
        >
          {/* Top cover swatch / emblem */}
          <div className="flex w-full flex-col items-center gap-1">
            <div
              className="h-5 w-6 overflow-hidden rounded-[2px] border shadow-inner"
              style={{
                borderColor: `${accent}88`,
                background: book.coverUrl ? undefined : `linear-gradient(135deg, ${accent}44, ${bgDark})`,
              }}
            >
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center font-serif-book text-[9px] font-semibold"
                  style={{ color: accent }}
                >
                  {book.title.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="h-[1px] w-4 opacity-50" style={{ backgroundColor: accent }} />
          </div>

          {/* Vertical book title */}
          <div className="writing-vertical my-1 flex max-h-[138px] items-center justify-center overflow-hidden">
            <span
              className={`font-serif-book font-medium leading-none tracking-tight ${
                titleLen > 34 ? 'text-[11px]' : 'text-[12.5px]'
              }`}
            >
              {book.title}
            </span>
          </div>

          {/* Bottom metadata + optional reading indicator */}
          <div className="flex w-full flex-col items-center gap-1">
            {bookState?.status && (
              <span
                className="text-[10px] leading-none"
                title={
                  bookState.status === 'read'
                    ? 'Đã đọc'
                    : bookState.status === 'reading'
                      ? 'Đang đọc'
                      : 'Muốn đọc'
                }
              >
                {bookState.status === 'read' ? '✅' : bookState.status === 'reading' ? '📖' : '🔖'}
              </span>
            )}
            <span
              className="w-full truncate text-center font-sans-ui text-[8.5px] opacity-80"
              style={{ color: accent }}
            >
              {book.author.split(' ').slice(-1)[0]}
            </span>
          </div>
        </div>

        {/* Angled Front Cover Peek when book is active */}
        {isActive && (
          <div className="h-full w-[124px] origin-left overflow-hidden rounded-r-md shadow-[10px_14px_26px_rgba(0,0,0,0.38)]">
            <BookCoverArt book={book} size="sm" className="h-full w-full" />
          </div>
        )}
      </div>
    </button>
  );
}
