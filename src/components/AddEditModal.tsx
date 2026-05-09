import { useForm, useWatch } from 'react-hook-form';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { RecurringRule, Category, Currency } from '../db/model';
import type { Transaction } from '../db/model';
import type { VirtualTransaction } from '../utils/transaction.utils';
import { useSpending } from '../hooks/useSpending';
import { GlassButton } from './ui/GlassButton';

interface AddEditModalProps {
  onClose: () => void;
  editTransaction?: Transaction;
  editRecurring?: RecurringRule;
  editVirtual?: VirtualTransaction;
  categories: Category[];
  currencies: Currency[];
}

type TransactionMode = 'one-time' | 'recurring';

type FormValues = {
  mode: TransactionMode;
  type: 'EXPENSE' | 'INCOME';
  amount: string;
  currencyCode: string;
  date: string;
  categoryId: string;
  note: string;
  frequency: RecurringRule['frequency'];
  startDate: string;
  endDate: string;
};

export function AddEditModal({ onClose, editTransaction, editRecurring, editVirtual, categories, currencies }: AddEditModalProps) {
  const isEditing = !!(editTransaction || editRecurring || editVirtual);
  const defaultCurrency = currencies.find(c => c.isDefault) ?? currencies[0];

  const { register, handleSubmit, control, setValue } = useForm<FormValues>({
    defaultValues: {
      mode: editRecurring || editVirtual ? 'recurring' : 'one-time',
      type: editTransaction?.type ?? editRecurring?.type ?? editVirtual?.type ?? 'EXPENSE',
      amount: (editTransaction?.amount ?? editRecurring?.baseAmount ?? editVirtual?.amount ?? '').toString(),
      currencyCode: editTransaction?.currencyCode ?? editRecurring?.currencyCode ?? editVirtual?.currencyCode ?? defaultCurrency?.code ?? 'EUR',
      date: editTransaction?.date ?? editVirtual?.displayDate ?? format(new Date(), 'yyyy-MM-dd'),
      categoryId: editTransaction?.categoryId ?? editRecurring?.categoryId ?? editVirtual?.categoryId ?? categories[0]?.id ?? '',
      note: editTransaction?.note ?? editRecurring?.note ?? editVirtual?.note ?? '',
      frequency: editRecurring?.frequency ?? 'MONTHLY',
      startDate: editRecurring?.startDate ?? format(new Date(), 'yyyy-MM-dd'),
      endDate: editRecurring?.endDate ?? '',
    },
  });

  const mode = useWatch({ control, name: 'mode' });
  const type = useWatch({ control, name: 'type' });

  const {
    deleteConfirm,
    showScopeDialog,
    setShowScopeDialog,
    recurringScope,
    setRecurringScope,
    saveOneTime,
    saveRecurringRule,
    saveRecurringEdit,
    handleDelete,
  } = useSpending({ onClose, editTransaction, editRecurring, editVirtual });

  const onSubmit = async (values: FormValues) => {
    const parsedAmount = parseFloat(values.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (values.mode === 'one-time') {
      await saveOneTime(parsedAmount, values.currencyCode, values.date, values.categoryId, values.note, values.type);
    } else if (editVirtual) {
      if (!showScopeDialog) {
        setShowScopeDialog(true);
        return;
      }
      await saveRecurringEdit(parsedAmount, values.currencyCode, values.categoryId, values.date, values.endDate, values.note);
    } else {
      await saveRecurringRule(parsedAmount, values.currencyCode, values.categoryId, values.frequency, values.startDate, values.endDate, values.note, values.type);
    }
  };

  const inputClasses = "w-full px-4 py-3 border border-black/10 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-md transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full sm:max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/50 dark:border-white/10 max-h-[90vh] overflow-y-auto relative z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isEditing ? 'Edit' : 'Add'} Transaction
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!editVirtual && !isEditing && (
          <div className="flex rounded-2xl bg-black/5 dark:bg-white/5 p-1 mb-5 border border-black/5 dark:border-white/10">
            {(['one-time', 'recurring'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setValue('mode', m)}
                className={`flex-1 py-2 text-[13px] font-bold tracking-wide uppercase rounded-xl transition-all ${
                  mode === m 
                    ? 'bg-white dark:bg-white/20 shadow-sm text-primary dark:text-white border border-white/50 dark:border-white/10' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {m === 'one-time' ? 'One-Time' : 'Recurring'}
              </button>
            ))}
          </div>
        )}

        <div className="flex rounded-2xl bg-black/5 dark:bg-white/5 p-1 mb-6 border border-black/5 dark:border-white/10">
          {(['EXPENSE', 'INCOME'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setValue('type', t)}
              className={`flex-1 py-2 text-[13px] font-bold tracking-wide uppercase rounded-xl transition-all ${
                type === t
                  ? t === 'EXPENSE' 
                    ? 'bg-rose-500/90 text-white shadow-md shadow-rose-500/20' 
                    : 'bg-emerald-500/90 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {showScopeDialog && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-primary/10 dark:bg-primary/20 rounded-2xl border border-primary/20 dark:border-primary/20 backdrop-blur-md">
            <p className="text-sm font-bold text-primary dark:text-primary/90 mb-3">Edit which occurrences?</p>
            {(['this', 'forward', 'all'] as const).map(scope => (
              <label key={scope} className="flex items-center gap-3 mb-2 cursor-pointer group">
                <input
                  type="radio"
                  name="scope"
                  value={scope}
                  checked={recurringScope === scope}
                  onChange={() => setRecurringScope(scope)}
                  className="w-4 h-4 text-primary border-primary/30 focus:ring-primary"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                  {scope === 'this' ? 'This instance only' : scope === 'forward' ? 'This and future instances' : 'All instances'}
                </span>
              </label>
            ))}
            <GlassButton
              type="button"
              onClick={handleSubmit(onSubmit)}
              variant="primary"
              className="mt-4 w-full"
            >
              Confirm
            </GlassButton>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register('amount')}
                className={inputClasses}
              />
            </div>
            <div className="w-28">
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Currency</label>
              <select
                {...register('currencyCode')}
                className={inputClasses}
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
          </div>

          {(mode === 'one-time' || editVirtual) && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Date</label>
              <input
                type="date"
                {...register('date')}
                className={inputClasses}
              />
            </div>
          )}

          {mode === 'recurring' && !editVirtual && (
            <>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Frequency</label>
                <select
                  {...register('frequency')}
                  className={inputClasses}
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="SEMI_MONTHLY">Semi-Monthly (based on start day)</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="BIMONTHLY">Every 2 Months</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Start Date</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className={inputClasses}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">End Date</label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className={inputClasses}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Category</label>
            <select
              {...register('categoryId')}
              className={inputClasses}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Note (optional)</label>
            <textarea
              rows={2}
              placeholder="Add a note..."
              {...register('note')}
              className={`${inputClasses} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-4">
            {isEditing && !showScopeDialog && (
              <GlassButton
                type="button"
                onClick={handleDelete}
                variant={deleteConfirm ? "danger" : "ghost"}
                className={deleteConfirm ? "" : "text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30"}
              >
                {deleteConfirm ? 'Confirm Delete' : 'Delete'}
              </GlassButton>
            )}
            {!showScopeDialog && (
              <GlassButton
                type="submit"
                variant="primary"
                className="flex-1"
              >
                {isEditing ? 'Save Changes' : 'Add Transaction'}
              </GlassButton>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
