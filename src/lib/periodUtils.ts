import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';

export function getPeriodBounds(anchorDate: string, periodType: 'week' | 'month' | 'year'): { start: Date; end: Date } {
  const date = parseISO(anchorDate);
  if (periodType === 'week') return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
  if (periodType === 'month') return { start: startOfMonth(date), end: endOfMonth(date) };
  return { start: startOfYear(date), end: endOfYear(date) };
}
