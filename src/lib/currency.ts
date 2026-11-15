import { Currency } from '@/types';

// Standard baseline exchange rates (USD base)
export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  EUR: 0.93,    // 1 USD = 0.93 EUR (~1 EUR = 1.075 USD)
  SEK: 10.65,   // 1 USD = 10.65 SEK (~1 SEK = 0.094 USD)
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  SEK: 'kr',
  EUR: '€',
  USD: '$',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  SEK: 'Swedish Krona (kr)',
  EUR: 'Euro (€)',
  USD: 'US Dollar ($)',
};

/**
 * Converts an amount from one currency to another using the USD-pegged exchange rate table.
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: Record<Currency, number> = EXCHANGE_RATES
): number {
  if (from === to) return amount;
  // Convert 'from' to USD first
  const inUSD = amount / rates[from];
  // Convert USD to 'to'
  return inUSD * rates[to];
}

/**
 * Formats a numeric price into a localized currency string.
 */
export function formatPrice(amount: number, currency: Currency): string {
  if (isNaN(amount)) return 'N/A';

  const round = currency === 'SEK' ? Math.round(amount) : Math.round(amount * 100) / 100;

  switch (currency) {
    case 'SEK':
      return `${round.toLocaleString('sv-SE')} kr`;
    case 'EUR':
      return `€${round.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    case 'USD':
      return `$${round.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    default:
      return `${round} ${currency}`;
  }
}

/**
 * Formats percentage change with +/- signs
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
