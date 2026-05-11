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

  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const rows: Record<string, string>[] = [];

  for (const tx of transactions) {
    const cat = categoryMap.get(tx.categoryId);
    rows.push({
      id: tx.id,
      type: tx.type,
      amount: tx.amount.toString(),
      currency: tx.currencyCode,
      date: tx.date,
      category: cat?.name ?? tx.categoryId,
      category_id: tx.categoryId,
      category_color: cat?.color ?? '#94a3b8',
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
      const cat = categoryMap.get(inst.categoryId);
      rows.push({
        id: inst.id,
        type: inst.type,
        amount: inst.amount.toString(),
        currency: inst.currencyCode,
        date: inst.displayDate,
        category: cat?.name ?? inst.categoryId,
        category_id: inst.categoryId,
        category_color: cat?.color ?? '#94a3b8',
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
): Promise<{ imported: number; errors: string[] }> {
  return new Promise(resolve => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        const errors: string[] = [];
        let imported = 0;

        // Load existing categories to match or create
        const allCategories = await db.categories.toArray();
        const categoryIdSet = new Set(allCategories.map(c => c.id));
        const categoryNameMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c.id]));

        for (const row of results.data) {
          try {
            const amount = parseFloat(row.amount);
            if (isNaN(amount)) throw new Error(`Invalid amount: ${row.amount}`);
            const date = row.date;
            if (!date) throw new Error('Missing date');

            const type = (
              row.type?.toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE'
            ) as 'EXPENSE' | 'INCOME';

            // Resolve Category
            const categoryName = row.category || 'Other';
            const categoryIdInCsv = row.category_id;
            const categoryColor = row.category_color || '#94a3b8';

            let categoryId: string;

            // 1. Try matching by ID first if present
            if (categoryIdInCsv && categoryIdSet.has(categoryIdInCsv)) {
              categoryId = categoryIdInCsv;
            }
            // 2. Try matching by Name (case insensitive)
            else if (categoryNameMap.has(categoryName.toLowerCase())) {
              categoryId = categoryNameMap.get(categoryName.toLowerCase())!;
            }
            // 3. Create new category
            else {
              categoryId = categoryIdInCsv || crypto.randomUUID();
              await db.categories.put({
                id: categoryId,
                name: categoryName,
                color: categoryColor,
                isDefault: false,
              });
              // Update maps for subsequent rows
              categoryIdSet.add(categoryId);
              categoryNameMap.set(categoryName.toLowerCase(), categoryId);
            }

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
