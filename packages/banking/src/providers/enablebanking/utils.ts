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
 * Within each tier, the entry with the highest absolute amount wins
 * (handles multi-currency accounts).
 */
export function selectPrimaryBalance(balances: Balance[]): Balance | undefined {
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

  for (const match of tiers) {
    const tier = balances.filter(match);
    const winner = pickHighest(tier);
    if (winner) return winner;
  }

  return balances[0];
}
