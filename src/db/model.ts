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
