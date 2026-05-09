import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useTransactions, type AnyTx } from '../hooks/useTransactions';
import { PeriodHeader } from '../components/PeriodHeader';
import { TransactionItem } from '../components/TransactionItem';
import { AddEditModal } from '../components/AddEditModal';
import { motion } from 'framer-motion';
import type { Transaction } from '../db/model';
import type { VirtualTransaction } from '../utils/transaction.utils';

export function ListView() {
  const { isLoading, allTx, currencies, categories, categoryMap, activeCurrencyCode } = useTransactions();

  const [selectedTx, setSelectedTx] = useState<Transaction | undefined>();
  const [selectedVirtual, setSelectedVirtual] = useState<VirtualTransaction | undefined>();
  const [showModal, setShowModal] = useState(false);

  if (isLoading) return <div className="p-6 text-slate-500 dark:text-slate-400 font-medium">Loading your finances...</div>;

  const sortedAllTx = [...allTx].sort((a, b) => {
    const aDate = 'displayDate' in a && a.displayDate ? a.displayDate : ('date' in a ? a.date : '') ?? '';
    const bDate = 'displayDate' in b && b.displayDate ? b.displayDate : ('date' in b ? b.date : '') ?? '';
    return bDate.localeCompare(aDate);
  });

  const grouped: Record<string, AnyTx[]> = {};
  for (const tx of sortedAllTx) {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-full bg-transparent">
      <PeriodHeader />

      {sortedDates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center px-4"
        >
          <div className="w-20 h-20 bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 shadow-xl border border-white/30 dark:border-white/10">
            <span className="text-4xl">📋</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">No transactions for this period</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="p-4 md:p-6 space-y-6"
        >
          {sortedDates.map(date => (
            <motion.div variants={itemVariants} key={date} className="space-y-1">
              <div className="px-2 py-2 sticky top-[calc(env(safe-area-inset-top,0px)+7.25rem)] md:top-[calc(env(safe-area-inset-top,0px)+5.5rem)] z-10">
                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-4">
                  {format(parseISO(date), 'EEEE, MMMM d')}
                </span>
              </div>
              <div className="space-y-1">
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
            </motion.div>
          ))}
        </motion.div>
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
