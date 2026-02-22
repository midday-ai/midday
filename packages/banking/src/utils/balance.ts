import { isValidCurrency } from "./currency";

export interface BalanceAdapter<T> {
  getType: (b: T) => string;
  getAmount: (b: T) => string;
  getCurrency: (b: T) => string;
}

/**
 * Generic primary-balance selection used by both GoCardless and EnableBanking.
 *
 * Walks `tiers` (each tier is a list of matching balance-type names) in order,
 * preferring balances whose currency matches `preferredCurrency` when provided.
 * Within a tier, picks the entry with the highest absolute amount. Falls back to
 * the first currency-matched or first overall balance when no tier matches.
 */
export function selectPrimaryBalance<T>(
  balances: T[] | undefined,
  adapter: BalanceAdapter<T>,
  tiers: string[][],
  preferredCurrency?: string,
): T | undefined {
  if (!balances?.length) return undefined;

  const pickHighest = (items: T[]): T | undefined =>
    items.length === 0
      ? undefined
      : items.reduce((max, current) => {
          const curAbs = Math.abs(+adapter.getAmount(current));
          const maxAbs = Math.abs(+adapter.getAmount(max));
          return curAbs > maxAbs ? current : max;
        });

  const hasCurrencyHint =
    preferredCurrency && isValidCurrency(preferredCurrency);
  const currencyMatch = hasCurrencyHint
    ? balances.filter(
        (b) =>
          adapter.getCurrency(b).toUpperCase() ===
          preferredCurrency.toUpperCase(),
      )
    : [];

  for (const tierNames of tiers) {
    const matchesTier = (b: T) => tierNames.includes(adapter.getType(b));
    if (currencyMatch.length) {
      const winner = pickHighest(currencyMatch.filter(matchesTier));
      if (winner) return winner;
    }
    const winner = pickHighest(balances.filter(matchesTier));
    if (winner) return winner;
  }

  return currencyMatch[0] ?? balances[0];
}
