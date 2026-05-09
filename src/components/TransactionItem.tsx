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
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 px-6 py-4 bg-white/20 dark:bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/30 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-300 text-left group shadow-sm"
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_10px_rgba(255,255,255,0.05)] border border-white/20"
        style={{ backgroundColor: category?.color ?? '#94a3b8' }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
          {category?.name ?? 'Unknown'}
          {'isRecurring' in transaction && transaction.isRecurring && (
            <Repeat className="w-3.5 h-3.5 text-primary opacity-60" />
          )}
        </div>
        {transaction.note && (
          <div className="text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">{transaction.note}</div>
        )}
      </div>
      <div className={`text-[16px] font-black flex-shrink-0 tracking-tight ${transaction.type === 'INCOME' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
        {transaction.type === 'INCOME' ? '+' : '-'}{activeCurrency?.symbol ?? '$'}{convertedAmount.toFixed(2)}
      </div>
    </motion.button>
  );
}
