import type { Currency } from '../db/model';

export function convertAmount(
  amount: number,
  fromCode: string,
  toCode: string,
  currencies: Currency[],
): number {
  const from = currencies.find(c => c.code === fromCode);
  const to = currencies.find(c => c.code === toCode);
  if (!from || !to) return amount;
  return amount * (from.exchangeRateToUSD / to.exchangeRateToUSD);
}
