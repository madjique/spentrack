import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import { getPeriodBounds } from '../lib/periodUtils';
import { generateRecurringInstances } from '../lib/recurring';
import { PeriodHeader } from '../components/PeriodHeader';
import { DonutChart } from '../components/DonutChart';
import { useState } from 'react';
import { AddEditModal } from '../components/AddEditModal';
import { isWithinInterval, parseISO } from 'date-fns';
import type { Transaction } from '../db/database';
import type { VirtualTransaction } from '../lib/recurring';

function convertAmount(amount: number, fromCode: string, toCode: string, currencies: Array<{ code: string; exchangeRateToUSD: number }>): number {
  const from = currencies.find(c => c.code === fromCode);
  const to = currencies.find(c => c.code === toCode);
  if (!from || !to) return amount;
  return amount * (from.exchangeRateToUSD / to.exchangeRateToUSD);
}

export function Dashboard() {
  const { currentPeriodDate, periodType, activeCurrencyCode } = useAppStore();
  const { start, end } = getPeriodBounds(currentPeriodDate, periodType);

  const [editTx, setEditTx] = useState<Transaction | undefined>();
  const [editVirtual, setEditVirtual] = useState<VirtualTransaction | undefined>();
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

  if (!data) return <div className="p-4 text-gray-500 dark:text-gray-400">Loading...</div>;

  const { settings, categories, transactions, rules, exceptions } = data;
  const currencies = settings?.currencies ?? [];
  const activeCurrency = currencies.find(c => c.code === activeCurrencyCode) ?? currencies[0];

  const periodTransactions = transactions.filter(tx => {
    try {
      return isWithinInterval(parseISO(tx.date), { start, end });
    } catch { return false; }
  });

  const virtualInstances: VirtualTransaction[] = [];
  for (const rule of rules) {
    const instances = generateRecurringInstances(rule, start, end, exceptions);
    virtualInstances.push(...instances.filter(i => !i.isDeleted));
  }

  type AnyTx = (Transaction & { isRecurring?: false }) | VirtualTransaction;
  const allTx: AnyTx[] = [...periodTransactions, ...virtualInstances];

  const expenseTx = allTx.filter(tx => tx.type === 'EXPENSE');
  const incomeTx = allTx.filter(tx => tx.type === 'INCOME');

  const totalExpense = expenseTx.reduce((sum, tx) => sum + convertAmount(tx.amount, tx.currencyCode, activeCurrencyCode, currencies), 0);
  const totalIncome = incomeTx.reduce((sum, tx) => sum + convertAmount(tx.amount, tx.currencyCode, activeCurrencyCode, currencies), 0);

  const categoryMap = new Map(categories.map(c => [c.id, c]));

  const byCategory: Record<string, number> = {};
  for (const tx of expenseTx) {
    const converted = convertAmount(tx.amount, tx.currencyCode, activeCurrencyCode, currencies);
    byCategory[tx.categoryId] = (byCategory[tx.categoryId] ?? 0) + converted;
  }

  const chartData = Object.entries(byCategory)
    .map(([catId, value]) => ({
      name: categoryMap.get(catId)?.name ?? 'Other',
      value: parseFloat(value.toFixed(2)),
      color: categoryMap.get(catId)?.color ?? '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950">
      <PeriodHeader />

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expenses</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {activeCurrency?.symbol ?? '$'}{totalExpense.toFixed(2)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Income</div>
            <div className="text-xl font-bold text-green-500">
              {activeCurrency?.symbol ?? '$'}{totalIncome.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Net Balance</div>
          <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {activeCurrency?.symbol ?? '$'}{(totalIncome - totalExpense).toFixed(2)}
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Expenses by Category</h3>
            <DonutChart data={chartData} currencySymbol={activeCurrency?.symbol ?? '$'} />
          </div>
        )}

        {chartData.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Top Categories</h3>
            <div className="space-y-2">
              {chartData.slice(0, 5).map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">{item.name}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activeCurrency?.symbol ?? '$'}{item.value.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 w-10 text-right">
                    {totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {chartData.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm text-center">
            <div className="text-4xl mb-2">💸</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No transactions for this period</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Tap + to add your first transaction</p>
          </div>
        )}
      </div>

      {showModal && (
        <AddEditModal
          onClose={() => { setShowModal(false); setEditTx(undefined); setEditVirtual(undefined); }}
          editTransaction={editTx}
          editVirtual={editVirtual}
          categories={categories}
          currencies={currencies}
        />
      )}
    </div>
  );
}
