import { Dices, RotateCcw, X } from 'lucide-react';
import {
  ALL_FILTER_VALUE,
  type BookMeta,
  type FilterCriteria,
  type UserBookState,
} from '../data/types';
import { extractFilterOptions, filterBooks } from '../data/filters';

interface FilterPopoverProps {
  allBooks: BookMeta[];
  categories: string[];
  filters: FilterCriteria;
  bookStates: Record<string, UserBookState>;
  onChangeFilters: (next: FilterCriteria) => void;
  onResetFilters: () => void;
  onSelectBook: (book: BookMeta) => void;
  onPickRandom: (pool: BookMeta[]) => void;
  onClose: () => void;
}

const STATUS_PILLS: Array<{ id: FilterCriteria['status']; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'want', label: '🔖 Muốn đọc' },
  { id: 'reading', label: '📖 Đang đọc' },
  { id: 'read', label: '✅ Đã đọc' },
  { id: 'unmarked', label: 'Chưa đánh dấu' },
];

export function FilterPopover({
  allBooks,
  categories,
  filters,
  bookStates,
  onChangeFilters,
  onResetFilters,
  onSelectBook,
  onPickRandom,
  onClose,
}: FilterPopoverProps) {
  const { genres, authors, hasYears } = extractFilterOptions(allBooks);
  const matchedBooks = filterBooks(allBooks, filters, bookStates);
  const previewBooks = matchedBooks.slice(0, 80);

  return (
    <div
      role="dialog"
      aria-label="Lọc kệ sách"
      className="w-[min(94vw,520px)] rounded-2xl border border-[var(--border-soft)] bg-[var(--glass-strong)] p-4 text-[var(--ink)] shadow-2xl backdrop-blur-xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-serif-book text-lg font-medium">Lọc kệ sách</h3>
          <p className="font-sans-ui text-xs text-[var(--muted)]">
            {matchedBooks.length} / {allBooks.length} quyển phù hợp
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng bộ lọc"
          className="cursor-pointer rounded-full p-1.5 text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--ink)] dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Status pills */}
      <div className="mb-3">
        <span className="font-sans-ui mb-1.5 block text-[11px] font-medium text-[var(--muted)]">
          Trạng thái đọc
        </span>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_PILLS.map((pill) => {
            const active = filters.status === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onChangeFilters({ ...filters, status: pill.id })}
                className={`cursor-pointer rounded-full px-2.5 py-1 font-sans-ui text-xs transition ${
                  active
                    ? 'bg-[var(--cobalt)] font-medium text-white'
                    : 'border border-[var(--border-soft)] bg-[var(--sheet)] text-[var(--ink)] hover:border-[var(--cobalt)]'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dropdowns */}
      <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <label className="block">
          <span className="font-sans-ui mb-1 block text-[11px] font-medium text-[var(--muted)]">
            Nhóm
          </span>
          <select
            aria-label="Lọc theo nhóm sách"
            value={filters.categoryGroup}
            onChange={(e) =>
              onChangeFilters({ ...filters, categoryGroup: e.target.value })
            }
            className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--sheet)] px-2.5 py-1.5 font-sans-ui text-xs text-[var(--ink)] outline-none focus:border-[var(--cobalt)]"
          >
            <option value={ALL_FILTER_VALUE}>Mọi nhóm</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-sans-ui mb-1 block text-[11px] font-medium text-[var(--muted)]">
            Thể loại
          </span>
          <select
            aria-label="Lọc theo thể loại"
            value={filters.genre}
            onChange={(e) => onChangeFilters({ ...filters, genre: e.target.value })}
            className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--sheet)] px-2.5 py-1.5 font-sans-ui text-xs text-[var(--ink)] outline-none focus:border-[var(--cobalt)]"
          >
            <option value={ALL_FILTER_VALUE}>Mọi thể loại</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-sans-ui mb-1 block text-[11px] font-medium text-[var(--muted)]">
            Tác giả
          </span>
          <select
            aria-label="Lọc theo tác giả"
            value={filters.author}
            onChange={(e) => onChangeFilters({ ...filters, author: e.target.value })}
            className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--sheet)] px-2.5 py-1.5 font-sans-ui text-xs text-[var(--ink)] outline-none focus:border-[var(--cobalt)]"
          >
            <option value={ALL_FILTER_VALUE}>Mọi tác giả</option>
            {authors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Year range */}
      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="font-sans-ui mb-1 block text-[11px] font-medium text-[var(--muted)]">
            Từ năm {!hasYears && '(nếu có)'}
          </span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="VD: 1990"
            value={filters.yearFrom}
            onChange={(e) => onChangeFilters({ ...filters, yearFrom: e.target.value })}
            className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--sheet)] px-2.5 py-1.5 font-sans-ui text-xs text-[var(--ink)] outline-none focus:border-[var(--cobalt)]"
          />
        </label>
        <label className="block">
          <span className="font-sans-ui mb-1 block text-[11px] font-medium text-[var(--muted)]">
            Đến năm {!hasYears && '(nếu có)'}
          </span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="VD: 2026"
            value={filters.yearTo}
            onChange={(e) => onChangeFilters({ ...filters, yearTo: e.target.value })}
            className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--sheet)] px-2.5 py-1.5 font-sans-ui text-xs text-[var(--ink)] outline-none focus:border-[var(--cobalt)]"
          />
        </label>
      </div>

      {/* Preview list (max 80) */}
      <div className="mb-3 max-h-40 overflow-y-auto rounded-xl border border-[var(--border-soft)] bg-[var(--sheet)] p-2">
        {previewBooks.length === 0 ? (
          <p className="py-4 text-center font-sans-ui text-xs text-[var(--muted)]">
            Không tìm thấy cuốn sách nào khớp điều kiện.
          </p>
        ) : (
          <ul className="space-y-1">
            {previewBooks.map((book) => (
              <li key={book.id}>
                <button
                  type="button"
                  onClick={() => onSelectBook(book)}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1 text-left font-sans-ui text-xs transition hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <span className="truncate font-medium text-[var(--ink)]">
                    {book.title}
                  </span>
                  <span className="shrink-0 text-[11px] text-[var(--muted)]">
                    {book.author}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {matchedBooks.length > 80 && (
          <p className="mt-1.5 border-t border-[var(--border-soft)] pt-1.5 text-center font-sans-ui text-[11px] text-[var(--muted)]">
            Đang hiện 80/{matchedBooks.length} cuốn. Hãy lọc thêm để thu hẹp danh sách.
          </p>
        )}
      </div>

      {/* Action footer */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-soft)] px-3 py-1.5 font-sans-ui text-xs font-medium text-[var(--ink)] transition hover:border-[var(--cobalt)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Xóa lọc
        </button>
        <button
          type="button"
          disabled={matchedBooks.length === 0}
          onClick={() => onPickRandom(matchedBooks)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[var(--cobalt)] px-3.5 py-1.5 font-sans-ui text-xs font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Dices className="h-3.5 w-3.5" />
          🎲 Chọn giúp tôi một quyển
        </button>
      </div>
    </div>
  );
}
