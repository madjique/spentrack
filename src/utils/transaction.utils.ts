import { addWeeks, addMonths, addYears, isAfter, isBefore, parseISO, format, setDate } from 'date-fns';
import type { RecurringRule, RecurringException } from '../db/model';

export interface VirtualTransaction {
  id: string;
  ruleId: string;
  originalDate: string;
  displayDate: string;
  amount: number;
  currencyCode: string;
  categoryId: string;
  note?: string;
  type: 'EXPENSE' | 'INCOME';
  isRecurring: true;
  isException: boolean;
  isDeleted: boolean;
}

export function generateRecurringInstances(
  rule: RecurringRule,
  periodStart: Date,
  periodEnd: Date,
  exceptions: RecurringException[],
): VirtualTransaction[] {
  const results: VirtualTransaction[] = [];
  const exceptionMap = new Map(
    exceptions.filter(e => e.ruleId === rule.id).map(e => [e.originalDate, e]),
  );

  const ruleStart = parseISO(rule.startDate);
  const ruleEnd = rule.endDate ? parseISO(rule.endDate) : null;

  const generateDates = (): string[] => {
    const dates: string[] = [];
    let current = ruleStart;

    const effectiveEnd = ruleEnd
      ? isBefore(ruleEnd, periodEnd)
        ? ruleEnd
        : periodEnd
      : periodEnd;

    while (!isAfter(current, effectiveEnd)) {
      const dateStr = format(current, 'yyyy-MM-dd');
      if (!isBefore(current, periodStart)) {
        dates.push(dateStr);
      }

      switch (rule.frequency) {
        case 'WEEKLY':
          current = addWeeks(current, 1);
          break;
        case 'SEMI_MONTHLY': {
          const day = current.getDate();
          if (day < 15) {
            current = setDate(current, 15);
          } else {
            current = setDate(addMonths(current, 1), 1);
          }
          break;
        }
        case 'MONTHLY':
          current = addMonths(current, 1);
          break;
        case 'BIMONTHLY':
          current = addMonths(current, 2);
          break;
        case 'YEARLY':
          current = addYears(current, 1);
          break;
      }
    }
    return dates;
  };

  for (const originalDate of generateDates()) {
    const exception = exceptionMap.get(originalDate);
    const displayDate = exception?.newDate ?? originalDate;
    const amount = exception?.newAmount ?? rule.baseAmount;
    const isDeleted = exception?.isDeleted ?? false;

    results.push({
      id: `${rule.id}-${originalDate}`,
      ruleId: rule.id,
      originalDate,
      displayDate,
      amount,
      currencyCode: rule.currencyCode,
      categoryId: rule.categoryId,
      note: rule.note,
      type: rule.type,
      isRecurring: true,
      isException: !!exception,
      isDeleted,
    });
  }

  return results;
}
