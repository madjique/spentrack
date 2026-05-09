import { format, parseISO } from 'date-fns';
import { useAppStore } from '../store/useAppStore';

function formatPeriodLabel(anchorDate: string, periodType: 'week' | 'month' | 'year'): string {
  const d = parseISO(anchorDate);
  if (periodType === 'month') return format(d, 'MMMM yyyy');
  if (periodType === 'year') return format(d, 'yyyy');
  // week
  const { startOfWeek, endOfWeek } = (() => {
    const start = new Date(d);
    const day = start.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    start.setDate(start.getDate() + diff);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { startOfWeek: start, endOfWeek: end };
  })();
  return `${format(startOfWeek, 'MMM d')} – ${format(endOfWeek, 'MMM d, yyyy')}`;
}

export function PeriodHeader() {
  const { currentPeriodDate, periodType, setPeriodType, goToPrevPeriod, goToNextPeriod } = useAppStore();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex gap-1">
        {(['week', 'month', 'year'] as const).map(pt => (
          <button
            key={pt}
            onClick={() => setPeriodType(pt)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              periodType === pt
                ? 'bg-indigo-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {pt.charAt(0).toUpperCase() + pt.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={goToPrevPeriod} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 min-w-[140px] text-center">
          {formatPeriodLabel(currentPeriodDate, periodType)}
        </span>
        <button onClick={goToNextPeriod} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
