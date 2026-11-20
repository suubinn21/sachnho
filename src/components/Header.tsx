import { HardDriveDownload } from 'lucide-react';
import { siteConfig } from '../config/site';

interface HeaderProps {
  totalBooks: number;
  readCount: number;
  readingCount: number;
  onOpenBackup: () => void;
}

export function Header({
  totalBooks,
  readCount,
  readingCount,
  onOpenBackup,
}: HeaderProps) {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 pt-4 pb-2 sm:px-6 sm:pt-5">
      {/* Left: Personal Backup quick button (replaces public Donate button) */}
      <div className="flex flex-1 items-center">
        <button
          type="button"
          onClick={onOpenBackup}
          aria-label="Sao lưu và khôi phục dữ liệu cá nhân"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--glass)] px-3 py-1.5 font-sans-ui text-xs font-medium text-[var(--ink)] shadow-sm backdrop-blur-md transition hover:border-[var(--cobalt)] hover:text-[var(--cobalt)]"
        >
          <HardDriveDownload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sao lưu dữ liệu</span>
          <span className="sm:hidden">Sao lưu</span>
        </button>
      </div>

      {/* Center: Personalized Title */}
      <div className="flex shrink-0 flex-col items-center text-center">
        <span className="font-sans-ui text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          {siteConfig.appSubtitle}
        </span>
        <h1 className="font-serif-book mt-0.5 text-2xl font-medium tracking-tight text-[var(--ink)] sm:text-3xl">
          {siteConfig.appTitle}
        </h1>
      </div>

      {/* Right: Dynamic collection & progress indicator */}
      <div className="flex flex-1 justify-end">
        <div className="hidden rounded-full border border-[var(--border-soft)] bg-[var(--glass)] px-3 py-1.5 font-sans-ui text-xs text-[var(--muted)] backdrop-blur-md md:block">
          <span className="font-semibold text-[var(--ink)]">{totalBooks}</span> cuốn
          {readingCount > 0 && (
            <span> · {readingCount} đang đọc</span>
          )}
          {readCount > 0 && (
            <span> · {readCount} đã xong</span>
          )}
        </div>
      </div>
    </header>
  );
}
