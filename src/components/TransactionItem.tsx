import { format, parseISO } from 'date-fns';
import type { Category, Currency } from '../db/database';
import type { VirtualTransaction } from '../lib/recurring';
import type { Transaction } from '../db/database';

type AnyTransaction = (Transaction & { isRecurring?: false }) | VirtualTransaction;

interface TransactionItemProps {
  transaction: AnyTransaction;
  category?: Category;
  currencies: Currency[];
  activeCurrencyCode: string;
  onClick: () => void;
}

function convertAmount(amount: number, fromCode: string, toCode: string, currencies: Currency[]): number {
  const from = currencies.find(c => c.code === fromCode);
  const to = currencies.find(c => c.code === toCode);
  if (!from || !to) return amount;
  return amount * (from.exchangeRateToUSD / to.exchangeRateToUSD);
}

export function TransactionItem({ transaction, category, currencies, activeCurrencyCode, onClick }: TransactionItemProps) {
  const displayDate = 'displayDate' in transaction ? transaction.displayDate : transaction.date;
  const activeCurrency = currencies.find(c => c.code === activeCurrencyCode);
  const convertedAmount = convertAmount(transaction.amount, transaction.currencyCode, activeCurrencyCode, currencies);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: category?.color ?? '#94a3b8' }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {category?.name ?? 'Unknown'}
          {'isRecurring' in transaction && transaction.isRecurring && (
            <span className="ml-1 text-xs text-indigo-500">↻</span>
          )}
        </div>
        {transaction.note && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{transaction.note}</div>
        )}
        <div className="text-xs text-gray-400 dark:text-gray-500">{format(parseISO(displayDate), 'MMM d, yyyy')}</div>
      </div>
      <div className={`text-sm font-semibold flex-shrink-0 ${transaction.type === 'INCOME' ? 'text-green-500' : 'text-gray-800 dark:text-gray-200'}`}>
        {transaction.type === 'INCOME' ? '+' : '-'}{activeCurrency?.symbol ?? '$'}{convertedAmount.toFixed(2)}
      </div>
    </button>
  );
}
