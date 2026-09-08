import { z } from 'zod';

/** Platform default — all costs and Scope 3 transactions are stored in EUR. */
export const DEFAULT_CURRENCY = 'EUR';

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;

/** Accepted on import/OCR only; converted to EUR before storage. */
export const LEGACY_IMPORT_CURRENCIES = ['BGN'] as const;

export const IMPORT_CURRENCIES = [...SUPPORTED_CURRENCIES, ...LEGACY_IMPORT_CURRENCIES] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const currencySchema = z.enum(SUPPORTED_CURRENCIES);

/** Static FX rates to EUR (Bulgarian currency board rate for BGN). */
export const FX_TO_EUR: Record<string, number> = {
  EUR: 1.0,
  BGN: 1 / 1.9558,
  USD: 1 / 1.08,
  GBP: 1 / 0.86,
  CHF: 1 / 0.97,
};

export function convertToEUR(amount: number, currency: string): number {
  const rate = FX_TO_EUR[currency] ?? FX_TO_EUR.EUR;
  return Math.round(amount * rate * 100) / 100;
}

/** Normalize cost + currency for DB storage (always EUR). */
export function normalizeCostForStorage(
  amount: number | null | undefined,
  currency: string | null | undefined,
): { cost: number | null; currency: string } {
  if (amount == null || Number.isNaN(amount)) {
    return { cost: null, currency: DEFAULT_CURRENCY };
  }
  const cur = (currency?.trim() || DEFAULT_CURRENCY).toUpperCase();
  if (cur === DEFAULT_CURRENCY) {
    return { cost: amount, currency: DEFAULT_CURRENCY };
  }
  return { cost: convertToEUR(amount, cur), currency: DEFAULT_CURRENCY };
}

export function formatMoney(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return `${amount.toLocaleString('bg-BG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}
