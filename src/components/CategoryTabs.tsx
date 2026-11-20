import { PERSONAL_TAB_ID } from '../data/types';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  countsByCategory: Record<string, number>;
  totalCount: number;
  personalCount: number;
  personalLabel: string;
  onSelectCategory: (cat: string) => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  countsByCategory,
  totalCount,
  personalCount,
  personalLabel,
  onSelectCategory,
}: CategoryTabsProps) {
  const tabs = [
    { id: 'Tất cả', label: 'Tất cả', count: totalCount },
    ...categories.map((cat) => ({
      id: cat,
      label: cat,
      count: countsByCategory[cat] ?? 0,
    })),
    { id: PERSONAL_TAB_ID, label: personalLabel, count: personalCount },
  ];

  return (
    <nav
      aria-label="Nhóm sách"
      className="relative z-20 mx-auto mt-1 flex w-full max-w-5xl justify-center px-3 sm:px-4"
    >
      <div
        role="tablist"
        aria-label="Danh mục nhóm sách"
        className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-2xl border border-[var(--border-soft)] bg-[var(--glass)] p-1 shadow-sm backdrop-blur-md sm:gap-1.5 md:rounded-full"
      >
        {tabs.map((tab) => {
          const isSelected = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectCategory(tab.id)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 font-sans-ui text-xs font-medium transition-all sm:px-3.5 sm:py-1.5 sm:text-[13px] ${
                isSelected
                  ? 'bg-[var(--cobalt)] text-white shadow-sm'
                  : 'text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-black/8 text-[var(--muted)] dark:bg-white/10'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
