import { useForm, useWatch } from 'react-hook-form';
import { format } from 'date-fns';
import type { RecurringRule, Category, Currency } from '../db/model';
import type { Transaction } from '../db/model';
import type { VirtualTransaction } from '../utils/transaction.utils';
import { useSpending } from '../hooks/useSpending';

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit' : 'Add'} Transaction
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!editVirtual && !isEditing && (
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-4">
            {(['one-time', 'recurring'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setValue('mode', m)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === m ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {m === 'one-time' ? 'One-Time' : 'Recurring'}
              </button>
            ))}
          </div>
        )}

        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-4">
          {(['EXPENSE', 'INCOME'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setValue('type', t)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                type === t
                  ? t === 'EXPENSE' ? 'bg-red-500 text-white shadow' : 'bg-green-500 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {showScopeDialog && (
          <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">Edit which occurrences?</p>
            {(['this', 'forward', 'all'] as const).map(scope => (
              <label key={scope} className="flex items-center gap-2 mb-1 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value={scope}
                  checked={recurringScope === scope}
                  onChange={() => setRecurringScope(scope)}
                  className="text-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {scope === 'this' ? 'This instance only' : scope === 'forward' ? 'This and future instances' : 'All instances'}
                </span>
              </label>
            ))}
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="mt-2 w-full bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium"
            >
              Confirm
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register('amount')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Currency</label>
              <select
                {...register('currencyCode')}
                className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
          </div>

          {(mode === 'one-time' || editVirtual) && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {mode === 'recurring' && !editVirtual && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Frequency</label>
                <select
                  {...register('frequency')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="SEMI_MONTHLY">Semi-Monthly (based on start day)</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="BIMONTHLY">Every 2 Months</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End Date (optional)</label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
            <select
              {...register('categoryId')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Note (optional)</label>
            <textarea
              rows={2}
              placeholder="Add a note..."
              {...register('note')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            {isEditing && !showScopeDialog && (
              <button
                type="button"
                onClick={handleDelete}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  deleteConfirm ? 'bg-red-500 text-white' : 'border border-red-300 text-red-500 dark:border-red-700'
                }`}
              >
                {deleteConfirm ? 'Confirm Delete' : 'Delete'}
              </button>
            )}
            {!showScopeDialog && (
              <button
                type="submit"
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isEditing ? 'Save Changes' : 'Add Transaction'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

