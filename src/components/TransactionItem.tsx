import { motion } from 'framer-motion';
import { Repeat } from 'lucide-react';
import type { Category, Currency } from '../db/model';
import type { VirtualTransaction } from '../utils/transaction.utils';
import type { Transaction } from '../db/model';
import { convertAmount } from '../utils/currency.utils';

type AnyTransaction = (Transaction & { isRecurring?: false }) | VirtualTransaction;

interface TransactionItemProps {
  transaction: AnyTransaction;
  category?: Category;
  currencies: Currency[];
  activeCurrencyCode: string;
  onClick: () => void;
}

export function TransactionItem({ transaction, category, currencies, activeCurrencyCode, onClick }: TransactionItemProps) {
  const activeCurrency = currencies.find(c => c.code === activeCurrencyCode);
  const convertedAmount = convertAmount(transaction.amount, transaction.currencyCode, activeCurrencyCode, currencies);

  return (
    <motion.button
      whileTap={{ scale: 0.98, backgroundColor: 'rgba(0,0,0,0.02)' }}
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
    >
      <div
        className="w-4 h-4 rounded-full flex-shrink-0 shadow-inner"
        style={{ backgroundColor: category?.color ?? '#94a3b8' }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-slate-800 dark:text-white truncate flex items-center gap-1.5">
          {category?.name ?? 'Unknown'}
          {'isRecurring' in transaction && transaction.isRecurring && (
            <Repeat className="w-3.5 h-3.5 text-indigo-500" />
          )}
        </div>
        {transaction.note && (
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{transaction.note}</div>
        )}
      </div>
      <div className={`text-base font-bold flex-shrink-0 tracking-tight ${transaction.type === 'INCOME' ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
        {transaction.type === 'INCOME' ? '+' : '-'}{activeCurrency?.symbol ?? '$'}{convertedAmount.toFixed(2)}
      </div>
    </motion.button>
  );
}
