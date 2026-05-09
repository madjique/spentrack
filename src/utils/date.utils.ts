import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
  format,
} from 'date-fns';

export function getPeriodBounds(
  anchorDate: string,
  periodType: 'week' | 'month' | 'year',
): { start: Date; end: Date } {
  const date = parseISO(anchorDate);
  if (periodType === 'week')
    return {
      start: startOfWeek(date, { weekStartsOn: 1 }),
      end: endOfWeek(date, { weekStartsOn: 1 }),
    };
  if (periodType === 'month') return { start: startOfMonth(date), end: endOfMonth(date) };
  return { start: startOfYear(date), end: endOfYear(date) };
}

export function formatPeriodLabel(
  anchorDate: string,
  periodType: 'week' | 'month' | 'year',
): string {
  const d = parseISO(anchorDate);
  if (periodType === 'month') return format(d, 'MMMM yyyy');
  if (periodType === 'year') return format(d, 'yyyy');

  const start = new Date(d);
  const day = start.getDay();
  start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}
