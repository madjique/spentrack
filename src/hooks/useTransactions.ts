import { useLiveQuery } from 'dexie-react-hooks';
import { isWithinInterval, parseISO } from 'date-fns';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import { getPeriodBounds } from '../utils/date.utils';
import { generateRecurringInstances, type VirtualTransaction } from '../utils/transaction.utils';
import type { Transaction, Category, Currency } from '../db/model';

export type AnyTx = (Transaction & { isRecurring?: false; displayDate?: string }) | VirtualTransaction;

export function useTransactions() {
  const { currentPeriodDate, periodType, activeCurrencyCode } = useAppStore();
  const { start, end } = getPeriodBounds(currentPeriodDate, periodType);

  const data = useLiveQuery(async () => {
    const [settings, categories, transactions, rules, exceptions] = await Promise.all([
      db.settings.get('global'),
      db.categories.toArray(),
      db.transactions.toArray(),
      db.recurringRules.toArray(),
      db.recurringExceptions.toArray(),
    ]);
    return { settings, categories, transactions, rules, exceptions };
  }, []);

  const currencies: Currency[] = data?.settings?.currencies ?? [];
  const categories: Category[] = data?.categories ?? [];
  const categoryMap = new Map(categories.map(c => [c.id, c]));

  const allTx: AnyTx[] = [];

  if (data) {
    const { transactions, rules, exceptions } = data;

    const periodTransactions: AnyTx[] = transactions
      .filter(tx => {
        try {
          return isWithinInterval(parseISO(tx.date), { start, end });
        } catch {
          return false;
        }
      })
      .map(tx => ({ ...tx, displayDate: tx.date }));

    const virtualInstances: VirtualTransaction[] = [];
    for (const rule of rules) {
      const instances = generateRecurringInstances(rule, start, end, exceptions);
      virtualInstances.push(...instances.filter(i => !i.isDeleted));
    }

    allTx.push(...periodTransactions, ...virtualInstances);
  }

  return {
    isLoading: !data,
    allTx,
    currencies,
    categories,
    categoryMap,
    activeCurrencyCode,
    start,
    end,
  };
}
