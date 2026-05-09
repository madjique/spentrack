import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { isWithinInterval, parseISO, format } from 'date-fns';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import { getPeriodBounds } from '../lib/periodUtils';
import { generateRecurringInstances, type VirtualTransaction } from '../lib/recurring';
import { PeriodHeader } from '../components/PeriodHeader';
import { TransactionItem } from '../components/TransactionItem';
import { AddEditModal } from '../components/AddEditModal';
import type { Transaction } from '../db/database';

type AnyTx = (Transaction & { isRecurring?: false; displayDate?: string }) | VirtualTransaction;

export function ListView() {
  const { currentPeriodDate, periodType, activeCurrencyCode } = useAppStore();
  const { start, end } = getPeriodBounds(currentPeriodDate, periodType);

  const [selectedTx, setSelectedTx] = useState<Transaction | undefined>();
  const [selectedVirtual, setSelectedVirtual] = useState<VirtualTransaction | undefined>();
  const [showModal, setShowModal] = useState(false);

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

  if (!data) return <div className="p-4 text-gray-500">Loading...</div>;

  const { settings, categories, transactions, rules, exceptions } = data;
  const currencies = settings?.currencies ?? [];
  const categoryMap = new Map(categories.map(c => [c.id, c]));

  const periodTransactions: AnyTx[] = transactions
    .filter(tx => {
      try { return isWithinInterval(parseISO(tx.date), { start, end }); } catch { return false; }
    })
    .map(tx => ({ ...tx, displayDate: tx.date }));

  const virtualInstances: VirtualTransaction[] = [];
  for (const rule of rules) {
    const instances = generateRecurringInstances(rule, start, end, exceptions);
    virtualInstances.push(...instances.filter(i => !i.isDeleted));
  }

  const allTx: AnyTx[] = [...periodTransactions, ...virtualInstances];
  allTx.sort((a, b) => {
    const aDate = 'displayDate' in a && a.displayDate ? a.displayDate : ('date' in a ? a.date : '') ?? '';
    const bDate = 'displayDate' in b && b.displayDate ? b.displayDate : ('date' in b ? b.date : '') ?? '';
    return bDate.localeCompare(aDate);
  });

  const grouped: Record<string, AnyTx[]> = {};
  for (const tx of allTx) {
    const d = 'displayDate' in tx && tx.displayDate ? tx.displayDate : ('date' in tx ? tx.date : '') ?? '';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(tx);
  }

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  function handleClick(tx: AnyTx) {
    if ('isRecurring' in tx && tx.isRecurring) {
      setSelectedVirtual(tx as VirtualTransaction);
    } else {
      setSelectedTx(tx as Transaction);
    }
    setShowModal(true);
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950">
      <PeriodHeader />

      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-500 dark:text-gray-400">No transactions for this period</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {format(parseISO(date), 'EEEE, MMMM d')}
                </span>
              </div>
              {grouped[date].map(tx => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx as AnyTx & { isRecurring?: false }}
                  category={categoryMap.get(tx.categoryId)}
                  currencies={currencies}
                  activeCurrencyCode={activeCurrencyCode}
                  onClick={() => handleClick(tx)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddEditModal
          onClose={() => { setShowModal(false); setSelectedTx(undefined); setSelectedVirtual(undefined); }}
          editTransaction={selectedTx}
          editVirtual={selectedVirtual}
          categories={categories}
          currencies={currencies}
        />
      )}
    </div>
  );
}
