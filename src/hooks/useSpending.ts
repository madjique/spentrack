import { useState } from 'react';
import { format } from 'date-fns';
import { db } from '../db/database';
import type { Transaction, RecurringRule } from '../db/model';
import type { VirtualTransaction } from '../utils/transaction.utils';

export type RecurringEditScope = 'this' | 'forward' | 'all';

interface UseSpendingOptions {
  onClose: () => void;
  editTransaction?: Transaction;
  editRecurring?: RecurringRule;
  editVirtual?: VirtualTransaction;
}

export function useSpending({
  onClose,
  editTransaction,
  editRecurring,
  editVirtual,
}: UseSpendingOptions) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showScopeDialog, setShowScopeDialog] = useState(false);
  const [recurringScope, setRecurringScope] = useState<RecurringEditScope>('this');

  async function saveOneTime(
    amount: number,
    currencyCode: string,
    date: string,
    categoryId: string,
    note: string,
    type: 'EXPENSE' | 'INCOME',
  ) {
    const tx: Transaction = {
      id: editTransaction?.id ?? crypto.randomUUID(),
      amount,
      currencyCode,
      date,
      categoryId,
      note: note || undefined,
      type,
    };
    await db.transactions.put(tx);
    onClose();
  }

  async function saveRecurringRule(
    amount: number,
    currencyCode: string,
    categoryId: string,
    frequency: RecurringRule['frequency'],
    startDate: string,
    endDate: string,
    note: string,
    type: 'EXPENSE' | 'INCOME',
  ) {
    const rule: RecurringRule = {
      id: editRecurring?.id ?? crypto.randomUUID(),
      baseAmount: amount,
      currencyCode,
      categoryId,
      frequency,
      startDate,
      endDate: endDate || undefined,
      note: note || undefined,
      type,
    };
    await db.recurringRules.put(rule);
    onClose();
  }

  async function saveRecurringEdit(
    amount: number,
    currencyCode: string,
    categoryId: string,
    date: string,
    endDate: string,
    note: string,
  ) {
    if (!editVirtual) return;

    if (recurringScope === 'this') {
      await db.recurringExceptions.put({
        id: crypto.randomUUID(),
        ruleId: editVirtual.ruleId,
        originalDate: editVirtual.originalDate,
        isDeleted: false,
        newAmount: amount !== editVirtual.amount ? amount : undefined,
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
          baseAmount: amount,
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
          baseAmount: amount,
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
      if (!deleteConfirm) {
        setDeleteConfirm(true);
        return;
      }
      await db.recurringExceptions.put({
        id: crypto.randomUUID(),
        ruleId: editVirtual.ruleId,
        originalDate: editVirtual.originalDate,
        isDeleted: true,
      });
      onClose();
    } else if (editRecurring) {
      if (!deleteConfirm) {
        setDeleteConfirm(true);
        return;
      }
      await db.recurringRules.delete(editRecurring.id);
      await db.recurringExceptions.where('ruleId').equals(editRecurring.id).delete();
      onClose();
    }
  }

  async function handleDeleteAll() {
    if (editVirtual) {
      await db.recurringRules.delete(editVirtual.ruleId);
      await db.recurringExceptions.where('ruleId').equals(editVirtual.ruleId).delete();
      onClose();
    }
  }

  return {
    deleteConfirm,
    showScopeDialog,
    setShowScopeDialog,
    recurringScope,
    setRecurringScope,
    saveOneTime,
    saveRecurringRule,
    saveRecurringEdit,
    handleDelete,
    handleDeleteAll,
  };
}
