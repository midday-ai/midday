import { isValidCurrency } from "../../utils/currency";
import type { GetBalancesResponse } from "./types";

type Balance = GetBalancesResponse["balances"][0];

/**
 * Select the primary balance from a list of balances.
 *
 * Priority (booked-first for accounting accuracy):
 *   1. interimBooked / ITBD  – current intraday settled balance
 *   2. closingBooked / CLBD  – end-of-day settled balance
 *   3. interimAvailable / ITAV – current available (may include credit limits)
 *   4. expected / XPCD
 *   5. any remaining balance
 *
 * When `preferredCurrency` is provided, balances matching that currency are
 * tried first within each tier. This prevents multi-currency accounts from
 * picking the wrong currency based on raw amount comparison.
 */
export function selectPrimaryBalance(
  balances: Balance[],
  preferredCurrency?: string,
): Balance | undefined {
  if (!balances.length) return undefined;

  const tiers: ((b: Balance) => boolean)[] = [
    (b) => b.balance_type === "interimBooked" || b.balance_type === "ITBD",
    (b) => b.balance_type === "closingBooked" || b.balance_type === "CLBD",
    (b) => b.balance_type === "interimAvailable" || b.balance_type === "ITAV",
    (b) => b.balance_type === "expected" || b.balance_type === "XPCD",
  ];

  const pickHighest = (items: Balance[]): Balance | undefined =>
    items.length === 0
      ? undefined
      : items.reduce((max, current) => {
          const curAbs = Math.abs(+current.balance_amount.amount);
          const maxAbs = Math.abs(+max.balance_amount.amount);
          return curAbs > maxAbs ? current : max;
        });

  const hasCurrencyHint =
    preferredCurrency && isValidCurrency(preferredCurrency);
  const currencyMatch = hasCurrencyHint
    ? balances.filter(
        (b) =>
          b.balance_amount.currency.toUpperCase() ===
          preferredCurrency.toUpperCase(),
      )
    : [];

  for (const match of tiers) {
    if (currencyMatch.length) {
      const winner = pickHighest(currencyMatch.filter(match));
      if (winner) return winner;
    }
    const winner = pickHighest(balances.filter(match));
    if (winner) return winner;
  }

  return currencyMatch[0] ?? balances[0];
}
