import { useState } from 'react';
import { format } from 'date-fns';
import { db } from '../db/database';
import type { Transaction, RecurringRule, Category, Currency } from '../db/database';
import type { VirtualTransaction } from '../lib/recurring';

interface AddEditModalProps {
  onClose: () => void;
  editTransaction?: Transaction;
  editRecurring?: RecurringRule;
  editVirtual?: VirtualTransaction;
  categories: Category[];
  currencies: Currency[];
}

type TransactionMode = 'one-time' | 'recurring';
type RecurringEditScope = 'this' | 'forward' | 'all';

export function AddEditModal({ onClose, editTransaction, editRecurring, editVirtual, categories, currencies }: AddEditModalProps) {
  const isEditing = !!(editTransaction || editRecurring || editVirtual);
  const defaultCurrency = currencies.find(c => c.isDefault) ?? currencies[0];

  const [mode, setMode] = useState<TransactionMode>(
    editRecurring || editVirtual ? 'recurring' : 'one-time'
  );
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>(
    editTransaction?.type ?? editRecurring?.type ?? editVirtual?.type ?? 'EXPENSE'
  );
  const [amount, setAmount] = useState(
    (editTransaction?.amount ?? editRecurring?.baseAmount ?? editVirtual?.amount ?? '').toString()
  );
  const [currencyCode, setCurrencyCode] = useState(
    editTransaction?.currencyCode ?? editRecurring?.currencyCode ?? editVirtual?.currencyCode ?? defaultCurrency?.code ?? 'EUR'
  );
  const [date, setDate] = useState(
    editTransaction?.date ?? editVirtual?.displayDate ?? format(new Date(), 'yyyy-MM-dd')
  );
  const [categoryId, setCategoryId] = useState(
    editTransaction?.categoryId ?? editRecurring?.categoryId ?? editVirtual?.categoryId ?? categories[0]?.id ?? ''
  );
  const [note, setNote] = useState(
    editTransaction?.note ?? editRecurring?.note ?? editVirtual?.note ?? ''
  );
  const [frequency, setFrequency] = useState<RecurringRule['frequency']>(
    editRecurring?.frequency ?? 'MONTHLY'
  );
  const [startDate, setStartDate] = useState(
    editRecurring?.startDate ?? format(new Date(), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(editRecurring?.endDate ?? '');
  const [recurringScope, setRecurringScope] = useState<RecurringEditScope>('this');
  const [showScopeDialog, setShowScopeDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  async function handleSave() {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (mode === 'one-time') {
      const tx: Transaction = {
        id: editTransaction?.id ?? crypto.randomUUID(),
        amount: parsedAmount,
        currencyCode,
        date,
        categoryId,
        note: note || undefined,
        type,
      };
      await db.transactions.put(tx);
    } else {
      if (editVirtual) {
        if (!showScopeDialog) {
          setShowScopeDialog(true);
          return;
        }
        await saveRecurringEdit(parsedAmount);
      } else {
        const rule: RecurringRule = {
          id: editRecurring?.id ?? crypto.randomUUID(),
          baseAmount: parsedAmount,
          currencyCode,
          categoryId,
          frequency,
          startDate,
          endDate: endDate || undefined,
          note: note || undefined,
          type,
        };
        await db.recurringRules.put(rule);
      }
    }
    onClose();
  }

  async function saveRecurringEdit(parsedAmount: number) {
    if (!editVirtual) return;

    if (recurringScope === 'this') {
      await db.recurringExceptions.put({
        id: crypto.randomUUID(),
        ruleId: editVirtual.ruleId,
        originalDate: editVirtual.originalDate,
        isDeleted: false,
        newAmount: parsedAmount !== editVirtual.amount ? parsedAmount : undefined,
        newDate: date !== editVirtual.originalDate ? date : undefined,
      });
    } else if (recurringScope === 'forward') {
      const rule = await db.recurringRules.get(editVirtual.ruleId);
      if (rule) {
        const prevDay = new Date(editVirtual.originalDate);
        prevDay.setDate(prevDay.getDate() - 1);
        await db.recurringRules.update(editVirtual.ruleId, {
          endDate: format(prevDay, 'yyyy-MM-dd'),
        });
        await db.recurringRules.put({
          ...rule,
          id: crypto.randomUUID(),
          baseAmount: parsedAmount,
          currencyCode,
          categoryId,
          startDate: editVirtual.originalDate,
          endDate: endDate || rule.endDate,
          note: note || undefined,
        });
      }
    } else {
      const rule = await db.recurringRules.get(editVirtual.ruleId);
      if (rule) {
        await db.recurringRules.put({
          ...rule,
          baseAmount: parsedAmount,
          currencyCode,
          categoryId,
          note: note || undefined,
        });
      }
    }
    onClose();
  }

  async function handleDelete() {
    if (editTransaction) {
      await db.transactions.delete(editTransaction.id);
      onClose();
    } else if (editVirtual) {
      if (!deleteConfirm) { setDeleteConfirm(true); return; }
      await db.recurringExceptions.put({
        id: crypto.randomUUID(),
        ruleId: editVirtual.ruleId,
        originalDate: editVirtual.originalDate,
        isDeleted: true,
      });
      onClose();
    } else if (editRecurring) {
      if (!deleteConfirm) { setDeleteConfirm(true); return; }
      await db.recurringRules.delete(editRecurring.id);
      await db.recurringExceptions.where('ruleId').equals(editRecurring.id).delete();
      onClose();
    }
  }

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
                onClick={() => setMode(m)}
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
              onClick={() => setType(t)}
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
              onClick={() => saveRecurringEdit(parseFloat(amount))}
              className="mt-2 w-full bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium"
            >
              Confirm
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Currency</label>
              <select
                value={currencyCode}
                onChange={e => setCurrencyCode(e.target.value)}
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
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {mode === 'recurring' && !editVirtual && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as RecurringRule['frequency'])}
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
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End Date (optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
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
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            {isEditing && !showScopeDialog && (
              <button
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
                onClick={handleSave}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isEditing ? 'Save Changes' : 'Add Transaction'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
