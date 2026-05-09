import Papa from 'papaparse';
import { db } from '../db/database';
import { generateRecurringInstances } from './transaction.utils';
import { format } from 'date-fns';

export async function exportAllTransactionsCSV(): Promise<void> {
  const [transactions, rules, exceptions, categories] = await Promise.all([
    db.transactions.toArray(),
    db.recurringRules.toArray(),
    db.recurringExceptions.toArray(),
    db.categories.toArray(),
  ]);

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const rows: Record<string, string>[] = [];

  for (const tx of transactions) {
    rows.push({
      id: tx.id,
      type: tx.type,
      amount: tx.amount.toString(),
      currency: tx.currencyCode,
      date: tx.date,
      category: categoryMap.get(tx.categoryId) ?? tx.categoryId,
      note: tx.note ?? '',
      recurring: 'false',
    });
  }

  const exportStart = new Date(new Date().getFullYear() - 10, 0, 1);
  const exportEnd = new Date(new Date().getFullYear() + 10, 11, 31);

  for (const rule of rules) {
    const instances = generateRecurringInstances(rule, exportStart, exportEnd, exceptions);
    for (const inst of instances) {
      if (inst.isDeleted) continue;
      rows.push({
        id: inst.id,
        type: inst.type,
        amount: inst.amount.toString(),
        currency: inst.currencyCode,
        date: inst.displayDate,
        category: categoryMap.get(inst.categoryId) ?? inst.categoryId,
        note: inst.note ?? '',
        recurring: 'true',
      });
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spentrack-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importTransactionsCSV(
  file: File,
  categoryIdToName: Map<string, string>,
): Promise<{ imported: number; errors: string[] }> {
  return new Promise(resolve => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        const errors: string[] = [];
        let imported = 0;
        const reverseCategoryMap = new Map(
          Array.from(categoryIdToName.entries()).map(([id, name]) => [name.toLowerCase(), id]),
        );

        for (const row of results.data) {
          try {
            const amount = parseFloat(row.amount);
            if (isNaN(amount)) throw new Error(`Invalid amount: ${row.amount}`);
            const date = row.date;
            if (!date) throw new Error('Missing date');

            const categoryName = row.category?.toLowerCase() ?? '';
            const categoryId = reverseCategoryMap.get(categoryName) ?? 'cat-other';
            const type = (
              row.type?.toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE'
            ) as 'EXPENSE' | 'INCOME';

            await db.transactions.put({
              id: row.id || crypto.randomUUID(),
              amount,
              currencyCode: row.currency || 'EUR',
              date,
              categoryId,
              note: row.note,
              type,
            });
            imported++;
          } catch (e) {
            errors.push(e instanceof Error ? e.message : 'Unknown error');
          }
        }
        resolve({ imported, errors });
      },
      error: err => {
        resolve({ imported: 0, errors: [err.message] });
      },
    });
  });
}
