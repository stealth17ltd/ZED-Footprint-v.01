'use client';

import { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearSelectorProps {
  years: number[];
  selectedYear: number;
}

export default function YearSelector({ years, selectedYear }: YearSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const navigate = (year: number) => {
    if (year === selectedYear) return;
    startTransition(() => {
      router.replace(`${pathname}?year=${year}`, { scroll: false });
      router.refresh();
    });
  };

  const currentIdx = years.indexOf(selectedYear);
  const canGoNewer = currentIdx > 0;
  const canGoOlder = currentIdx < years.length - 1;

  return (
    <div className={`flex items-center gap-1 ${isPending ? 'opacity-70' : ''}`}>
      {/* Prev (older) arrow */}
      <button
        type="button"
        onClick={() => canGoOlder && navigate(years[currentIdx + 1])}
        disabled={!canGoOlder || isPending}
        className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="По-стара година"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Year pills */}
      <div className="flex items-center gap-1">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => navigate(year)}
            disabled={isPending}
            className={[
              'h-7 px-3 rounded-md text-xs font-semibold transition-colors',
              year === selectedYear
                ? 'bg-earth-300 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            ].join(' ')}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Next (newer) arrow */}
      <button
        type="button"
        onClick={() => canGoNewer && navigate(years[currentIdx - 1])}
        disabled={!canGoNewer || isPending}
        className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="По-нова година"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
