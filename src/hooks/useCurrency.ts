import { useState } from 'react';
import { db } from '../db/database';
import { useAppStore } from '../store/useAppStore';
import type { AppSettings, Currency } from '../db/model';

export function useCurrency(settings: AppSettings | undefined, currencies: Currency[]) {
  const { setActiveCurrencyCode } = useAppStore();

  const [newCurrCode, setNewCurrCode] = useState('');
  const [newCurrSymbol, setNewCurrSymbol] = useState('');
  const [newCurrRate, setNewCurrRate] = useState('');

  async function updateCurrencies(newList: Currency[]) {
    if (!settings) return;
    await db.settings.put({ ...settings, currencies: newList });
  }

  async function addCurrency() {
    if (!newCurrCode || !newCurrSymbol || !newCurrRate) return;
    const rate = parseFloat(newCurrRate);
    if (isNaN(rate)) return;
    await updateCurrencies([
      ...currencies,
      {
        code: newCurrCode.toUpperCase(),
        symbol: newCurrSymbol,
        exchangeRateToUSD: rate,
        isDefault: currencies.length === 0,
      },
    ]);
    setNewCurrCode('');
    setNewCurrSymbol('');
    setNewCurrRate('');
  }

  async function deleteCurrency(code: string) {
    await updateCurrencies(currencies.filter(c => c.code !== code));
  }

  async function setDefaultCurrency(code: string) {
    await updateCurrencies(currencies.map(c => ({ ...c, isDefault: c.code === code })));
    setActiveCurrencyCode(code);
  }

  return {
    newCurrCode,
    setNewCurrCode,
    newCurrSymbol,
    setNewCurrSymbol,
    newCurrRate,
    setNewCurrRate,
    addCurrency,
    deleteCurrency,
    setDefaultCurrency,
  };
}
