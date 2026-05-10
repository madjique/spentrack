import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useTransactions, type AnyTx } from '../hooks/useTransactions';
import { PeriodHeader } from '../components/PeriodHeader';
import { TransactionItem } from '../components/TransactionItem';
import { AddEditModal } from '../components/AddEditModal';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { cn } from '../utils/cn';
import type { Transaction } from '../db/model';
import type { VirtualTransaction } from '../utils/transaction.utils';

export function ListView() {
  const { isLoading, allTx, currencies, categories, categoryMap, activeCurrencyCode } = useTransactions();

  const [selectedTx, setSelectedTx] = useState<Transaction | undefined>();
  const [selectedVirtual, setSelectedVirtual] = useState<VirtualTransaction | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  if (isLoading || !categories) return <div className="p-6 text-slate-500 dark:text-slate-400 font-medium">Loading your finances...</div>;

  const filteredTx = selectedCategoryId 
    ? allTx.filter(tx => tx.categoryId === selectedCategoryId)
    : allTx;

  const activeCurrency = currencies.find(c => c.code === activeCurrencyCode);
  const totalAmount = filteredTx.reduce((sum, tx) => {
    return tx.type === 'INCOME' ? sum - tx.amount : sum + tx.amount;
  }, 0);
  const selectedCategory = selectedCategoryId ? categoryMap.get(selectedCategoryId) : null;

  const sortedAllTx = [...filteredTx].sort((a, b) => {
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

      {allTx.length === 0 ? (
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
          {/* Category Filter */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-3 border-white/40 dark:border-white/5">
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-300 whitespace-nowrap",
                    !selectedCategoryId
                      ? "bg-primary text-white shadow-lg shadow-primary/25"
                      : "bg-white/40 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-white/50 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10"
                  )}
                >
                  All
                </button>
                {(() => {
                  const catTotals = new Map<string, number>();
                  for (const tx of allTx) {
                    const current = catTotals.get(tx.categoryId) ?? 0;
                    catTotals.set(tx.categoryId, tx.type === 'INCOME' ? current - tx.amount : current + tx.amount);
                  }

                  const presentCategoryIds = new Set(allTx.map(tx => tx.categoryId));
                  const displayCategories = categories.length > 2
                    ? categories.filter(c => presentCategoryIds.has(c.id))
                    : categories;

                  const sortedCategories = [...displayCategories].sort((a, b) => {
                    const totalA = Math.abs(catTotals.get(a.id) ?? 0);
                    const totalB = Math.abs(catTotals.get(b.id) ?? 0);
                    return totalB - totalA;
                  });

                  return sortedCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2",
                        selectedCategoryId === cat.id
                          ? "bg-white/90 dark:bg-white/15 text-slate-900 dark:text-white shadow-md ring-2 ring-inset ring-white/50 dark:ring-white/20"
                          : "bg-white/40 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-white/50 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10"
                      )}
                      style={selectedCategoryId === cat.id ? { color: cat.color } : {}}
                    >
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </button>
                  ));
                })()}
              </div>
            </GlassCard>
          </motion.div>

          {/* Category Total Card */}
          {selectedCategoryId && (
            <motion.div variants={itemVariants}>
              <GlassCard className="p-4 border-white/40 dark:border-white/10 shadow-xl flex flex-col justify-center">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: selectedCategory?.color ?? '#ccc' }} 
                    />
                    <span className="text-[13px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                      {selectedCategory?.name} Total
                    </span>
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeCurrency?.symbol}{totalAmount.toFixed(2)}
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {sortedDates.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium italic">No transactions match this category</p>
            </div>
          ) : (
            sortedDates.map(date => (
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
            ))
          )}
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
