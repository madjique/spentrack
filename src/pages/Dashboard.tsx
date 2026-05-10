import { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useTransactions, type AnyTx } from '../hooks/useTransactions';
import { PeriodHeader } from '../components/PeriodHeader';
import { TransactionItem } from '../components/TransactionItem';
import { AddEditModal } from '../components/AddEditModal';
import { GlassCard } from '../components/ui/GlassCard';
import { motion } from 'framer-motion';
import type { Transaction } from '../db/model';
import type { VirtualTransaction } from '../utils/transaction.utils';
import { cn } from '../utils/cn';

export function Dashboard() {
  const {
    isLoading,
    allTx,
    activeCurrencyCode,
    currencies,
    categoryMap,
    categories
  } = useTransactions();

  const [selectedTx, setSelectedTx] = useState<Transaction | undefined>();
  const [selectedVirtual, setSelectedVirtual] = useState<VirtualTransaction | undefined>();
  const [showModal, setShowModal] = useState(false);

  if (isLoading || !categories) return <div className="p-6 text-slate-500 dark:text-slate-400 font-medium">Loading your dashboard...</div>;

  const expenses = allTx.filter((tx: AnyTx) => tx.type === 'EXPENSE');
  const incomes = allTx.filter((tx: AnyTx) => tx.type === 'INCOME');

  const totalSpent = expenses.reduce((sum: number, tx: AnyTx) => sum + tx.amount, 0);
  const totalIncome = incomes.reduce((sum: number, tx: AnyTx) => sum + tx.amount, 0);

  const catTotals = new Map<string, number>();

  for (const exp of expenses) {
    const amount = exp.amount;
    const catId = exp.categoryId;
    catTotals.set(catId, (catTotals.get(catId) ?? 0) + amount);
  }

  const chartData = Array.from(catTotals.entries())
    .map(([catId, amount]) => {
      const c = categoryMap.get(catId);
      return {
        name: c?.name ?? 'Unknown',
        value: amount,
        color: c?.color ?? '#ccc'
      };
    })
    .sort((a, b) => b.value - a.value);

  const activeCurrency = currencies.find((c: any) => c.code === activeCurrencyCode);

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
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-full bg-transparent flex flex-col">
      <PeriodHeader />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full"
      >
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={itemVariants}>
            <GlassCard className="p-5 flex flex-col justify-center border-emerald-500/20 dark:border-emerald-500/10 shadow-emerald-900/5">
              <span className="text-[13px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-1">Income</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {activeCurrency?.symbol}{totalIncome.toFixed(2)}
              </span>
            </GlassCard>
          </motion.div>
          <motion.div variants={itemVariants}>
            <GlassCard className="p-5 flex flex-col justify-center border-rose-500/20 dark:border-rose-500/10 shadow-rose-900/5">
              <span className="text-[13px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-1">Expenses</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeCurrency?.symbol}{totalSpent.toFixed(2)}
              </span>
            </GlassCard>
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6 min-h-[18rem] flex flex-col border border-white/60 dark:border-white/10">
            <h3 className="text-[13px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">Spending by Category</h3>
            {chartData.length > 0 ? (
              <div className="space-y-6">
                <div className="h-64 -mx-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [`${activeCurrency?.symbol}${Number(value).toFixed(2)}`, name]}
                        contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontWeight: 600, color: '#0f172a' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category List */}
                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-200/50 dark:border-white/5">
                  {chartData.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{cat.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {activeCurrency?.symbol}{cat.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 font-medium py-12">
                No data to display
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Net Balance Widget */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5 flex flex-col justify-center border-white/60 dark:border-white/10 shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Net Balance</span>
              <span className={cn(
                "text-2xl font-black tracking-tight",
                (totalIncome - totalSpent) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {activeCurrency?.symbol}{(totalIncome - totalSpent).toFixed(2)}
              </span>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <div className="px-2">
            <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase ml-4">Recent Transactions</h3>
          </div>
          <div className="space-y-1">
            {allTx.slice(0, 5).map((tx: AnyTx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx as AnyTx & { isRecurring?: false }}
                category={categoryMap.get(tx.categoryId)}
                currencies={currencies}
                activeCurrencyCode={activeCurrencyCode}
                onClick={() => handleClick(tx)}
              />
            ))}
            {allTx.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-medium">
                No transactions found
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

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
