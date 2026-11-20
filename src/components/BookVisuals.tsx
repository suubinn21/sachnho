import type { BookMeta, UserBookState } from '../data/types';

interface BookCoverArtProps {
  book: Pick<BookMeta, 'id' | 'numericId' | 'title' | 'author' | 'genre' | 'categoryGroup' | 'coverUrl' | 'spinePalette' | 'chapterCount'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Render real cover image when available, or an editorial hardcover SVG/HTML
 * book cover with cloth sheen, inner foil frame, and Newsreader typography.
 */
export function BookCoverArt({ book, size = 'lg', className = '' }: BookCoverArtProps) {
  if (book.coverUrl) {
    return (
      <div className={`relative overflow-hidden rounded-r-lg rounded-l-[3px] shadow-xl ${className}`}>
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
      className={`relative flex flex-col justify-between overflow-hidden rounded-r-lg rounded-l-[2px] select-none shadow-[0_20px_42px_-12px_rgba(0,0,0,0.48)] ${className}`}
      style={{
        background: `linear-gradient(148deg, ${bg} 0%, ${bgDark} 100%)`,
        color: text,
      }}
      aria-label={`Bìa minh họa sách ${book.title}`}
    >
      {/* Subtle linen bookcloth sheen */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 22% 18%, rgba(255,255,255,0.28) 0%, transparent 52%), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Left spine hinge groove */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-3.5 opacity-45"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.24) 45%, rgba(0,0,0,0.18) 85%, transparent 100%)',
        }}
      />

      {/* Decorative foil border frame */}
      <div
        className={`relative flex h-full flex-col justify-between border ${
          isCompact ? 'm-1.5 p-2' : isMedium ? 'm-2.5 p-3' : 'm-3.5 p-5'
        }`}
        style={{ borderColor: `${accent}66` }}
      >
        <div className="flex items-center justify-between gap-2 pl-1">
          <span
            className={`font-sans-ui uppercase tracking-[0.16em] opacity-90 ${
              isCompact ? 'text-[7px]' : isMedium ? 'text-[9px]' : 'text-[10px]'
            }`}
            style={{ color: accent }}
          >
            {book.genre}
          </span>
          {!isCompact && (
            <span
              className="font-sans-ui rounded-full border px-2 py-0.5 text-[9px] font-medium opacity-85"
              style={{ borderColor: `${accent}66`, color: accent }}
            >
              #{book.numericId}
            </span>
          )}
        </div>

        <div className="my-auto py-2 pl-1">
          <div
            className={`mb-2 h-[2px] rounded-full ${isCompact ? 'mb-1 w-4' : 'w-9'}`}
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
            className={`font-sans-ui font-medium opacity-95 ${
              isCompact ? 'truncate text-[8px]' : isMedium ? 'truncate text-[11px]' : 'text-xs'
            }`}
          >
            {book.author}
          </p>
          {!isCompact && (
            <p className="font-sans-ui mt-0.5 text-[10px] opacity-70">
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
 * Tactile 3D hardcover book spine with cylindrical shading, embossed foil spine bands,
 * contact shadow on the walnut shelf, and an open-angle front cover + cream page block
 * edge reveal when active.
 */
export function BookSpine3D({
  book,
  isActive,
  bookState,
  onSelectOrOpen,
}: BookSpine3DProps) {
  const { bg, bgDark, text, accent } = book.spinePalette;
  const titleLen = book.title.length;
  const heightPx = 226 + ((book.numericId * 7) % 30);
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
        isActive ? '-translate-y-3 z-20' : 'hover:-translate-y-2.5 z-10'
      }`}
      style={{
        height: `${heightPx}px`,
        perspective: '1100px',
      }}
    >
      {/* Grounded contact shadow on the wooden shelf */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-1.5 left-1 right-1 h-2.5 rounded-full bg-black/45 blur-[4px] transition-opacity duration-300 ${
          isActive ? 'opacity-75' : 'opacity-45 group-hover:opacity-65'
        }`}
      />

      <div
        className="relative flex h-full items-stretch transition-transform duration-300 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: isActive
            ? 'rotateY(-20deg) scale(1.05)'
            : 'rotateY(0deg)',
        }}
      >
        {/* Cylindrical Hardcover Spine */}
        <div
          className="relative flex h-full flex-col items-center justify-between overflow-hidden rounded-l-[4px] border-r border-black/30 px-1.5 py-2.5 shadow-[4px_10px_20px_rgba(0,0,0,0.34)]"
          style={{
            width: `${spineWidth}px`,
            background: `linear-gradient(90deg, ${bgDark} 0%, ${bg} 28%, ${bg} 74%, ${bgDark} 100%)`,
            color: text,
          }}
        >
          {/* Cylindrical curvature sheen */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(255,255,255,0.16) 24%, rgba(255,255,255,0.03) 56%, rgba(0,0,0,0.26) 100%)',
            }}
          />

          {/* Top foil band & cover emblem */}
          <div className="relative flex w-full flex-col items-center gap-1">
            <span className="h-[2px] w-full opacity-55" style={{ backgroundColor: accent }} />
            <div
              className="mt-0.5 h-5 w-6 overflow-hidden rounded-[2px] border shadow-inner"
              style={{
                borderColor: `${accent}99`,
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
            <span className="h-[1px] w-5 opacity-55" style={{ backgroundColor: accent }} />
          </div>

          {/* Vertical book title */}
          <div className="writing-vertical relative my-1 flex max-h-[138px] items-center justify-center overflow-hidden">
            <span
              className={`font-serif-book font-medium leading-none tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] ${
                titleLen > 34 ? 'text-[11px]' : 'text-[12.5px]'
              }`}
            >
              {book.title}
            </span>
          </div>

          {/* Bottom foil band & author surname */}
          <div className="relative flex w-full flex-col items-center gap-1">
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
              className="w-full truncate text-center font-sans-ui text-[8.5px] font-medium opacity-85"
              style={{ color: accent }}
            >
              {book.author.split(' ').slice(-1)[0]}
            </span>
            <span className="h-[2px] w-full opacity-55" style={{ backgroundColor: accent }} />
          </div>
        </div>

        {/* Active Book: Angled Front Cover + 3D Cream Page Block Edge */}
        {isActive && (
          <>
            <div className="h-full w-[124px] origin-left overflow-hidden rounded-r-[4px] shadow-[8px_16px_28px_rgba(0,0,0,0.42)]">
              <BookCoverArt book={book} size="sm" className="h-full w-full" />
            </div>
            <div
              aria-hidden="true"
              className="my-[3px] w-[7px] rounded-r-[2px] border-y border-r border-black/20"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #f4efe3 0px, #e3dac7 1.5px, #f7f3e8 3px)',
              }}
            />
          </>
        )}
      </div>
    </button>
  );
}
