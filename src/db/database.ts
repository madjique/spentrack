import Dexie, { type Table } from 'dexie';

export interface Currency {
  code: string;
  symbol: string;
  exchangeRateToUSD: number;
  isDefault: boolean;
}

export interface AppSettings {
  id: 'global';
  theme: 'light' | 'dark' | 'system';
  defaultView: 'week' | 'month' | 'year';
  currencies: Currency[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  currencyCode: string;
  date: string;
  categoryId: string;
  note?: string;
  type: 'EXPENSE' | 'INCOME';
}

export interface RecurringRule {
  id: string;
  baseAmount: number;
  currencyCode: string;
  categoryId: string;
  frequency: 'WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY' | 'BIMONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  note?: string;
  type: 'EXPENSE' | 'INCOME';
}

export interface RecurringException {
  id: string;
  ruleId: string;
  originalDate: string;
  isDeleted: boolean;
  newAmount?: number;
  newDate?: string;
}

export interface CsvImportTemplate {
  id: string;
  name: string;
  columnMap: Record<string, string>;
}

export class SpenTrackDB extends Dexie {
  settings!: Table<AppSettings>;
  categories!: Table<Category>;
  transactions!: Table<Transaction>;
  recurringRules!: Table<RecurringRule>;
  recurringExceptions!: Table<RecurringException>;
  csvImportTemplates!: Table<CsvImportTemplate>;

  constructor() {
    super('SpenTrackDB');
    this.version(1).stores({
      settings: 'id',
      categories: 'id, name',
      transactions: 'id, date, categoryId, type',
      recurringRules: 'id, startDate, endDate, categoryId',
      recurringExceptions: 'id, ruleId, originalDate',
      csvImportTemplates: 'id, name',
    });
  }
}

export const db = new SpenTrackDB();

export async function seedDefaultData() {
  const existing = await db.settings.get('global');
  if (existing) return;

  await db.settings.put({
    id: 'global',
    theme: 'system',
    defaultView: 'month',
    currencies: [
      { code: 'EUR', symbol: '€', exchangeRateToUSD: 1.08, isDefault: true },
      { code: 'USD', symbol: '$', exchangeRateToUSD: 1.0, isDefault: false },
    ],
  });

  const categories: Category[] = [
    { id: 'cat-housing', name: 'Housing', color: '#6366f1', isDefault: true },
    { id: 'cat-food', name: 'Food & Dining', color: '#f59e0b', isDefault: true },
    { id: 'cat-transport', name: 'Transport', color: '#10b981', isDefault: true },
    { id: 'cat-health', name: 'Health', color: '#ef4444', isDefault: true },
    { id: 'cat-entertainment', name: 'Entertainment', color: '#8b5cf6', isDefault: true },
    { id: 'cat-shopping', name: 'Shopping', color: '#ec4899', isDefault: true },
    { id: 'cat-utilities', name: 'Utilities', color: '#14b8a6', isDefault: true },
    { id: 'cat-income', name: 'Income', color: '#22c55e', isDefault: true },
    { id: 'cat-other', name: 'Other', color: '#94a3b8', isDefault: true },
  ];
  await db.categories.bulkPut(categories);
}
