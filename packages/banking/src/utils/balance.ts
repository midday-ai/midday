import { type AccountType, CREDIT_ACCOUNT_TYPE } from "./account";

/**
 * Balance normalization utilities for banking providers.
 *
 * Balance conventions vary across providers:
 *
 * DEPOSITORY (checking, savings, money market):
 * - Positive = funds available
 * - Negative = overdraft (debt)
 *
 * CREDIT (credit cards):
 * - Positive = amount owed (debt)
 * - Provider differences:
 *   - Plaid: stores as positive
 *   - GoCardless: stores as negative
 *   - Teller: stores as positive
 *   - EnableBanking: stores as positive
 * - We normalize to POSITIVE for consistency
 *
 * LOAN:
 * - Positive = principal remaining (debt)
 */

export interface NormalizedBalance {
  /** Normalized balance amount (positive for debt on credit accounts) */
  amount: number;
  /** Currency code (uppercase) */
  currency: string;
}

/**
 * Normalize balance based on account type.
 *
 * Credit card balances are normalized to positive (amount owed).
 * This ensures consistency across all providers.
 *
 * @param rawAmount - The raw balance amount from the provider
 * @param currency - The currency code
 * @param accountType - The type of account
 * @returns Normalized balance with positive amount for credit cards
 *
 * @example
 * // GoCardless returns -1000 for $1000 owed on credit card
 * normalizeBalance(-1000, "USD", "credit")
 * // Returns: { amount: 1000, currency: "USD" }
 *
 * @example
 * // Plaid returns 500 for $500 in checking
 * normalizeBalance(500, "USD", "depository")
 * // Returns: { amount: 500, currency: "USD" }
 */
export function normalizeBalance(
  rawAmount: number,
  currency: string,
  accountType: AccountType,
): NormalizedBalance {
  const isCreditAccount = accountType === CREDIT_ACCOUNT_TYPE;
  const isNegative = rawAmount < 0;

  // Only normalize negative credit balances to positive
  const amount =
    isCreditAccount && isNegative ? Math.abs(rawAmount) : rawAmount;

  return {
    amount,
    currency: currency.toUpperCase(),
  };
}

/**
 * Determine which balance field to use for display.
 *
 * For credit cards: use `current` (amount owed)
 * For depository: prefer `available`, fallback to `current`
 *
 * @param params - Balance fields and account type
 * @returns The appropriate balance amount for display
 *
 * @example
 * // Credit card with $5000 limit, $1000 owed, $4000 available
 * selectDisplayBalance({ current: 1000, available: 4000, accountType: "credit" })
 * // Returns: 1000 (amount owed)
 *
 * @example
 * // Checking with $500 current, $450 available (pending transactions)
 * selectDisplayBalance({ current: 500, available: 450, accountType: "depository" })
 * // Returns: 450 (available to spend)
 */
export function selectDisplayBalance(params: {
  current?: number | null;
  available?: number | null;
  accountType: AccountType;
}): number {
  const { current, available, accountType } = params;

  if (accountType === CREDIT_ACCOUNT_TYPE) {
    // Credit cards: show amount owed (current balance)
    return current ?? 0;
  }

  // Depository/other: prefer available (what can be spent)
  return available ?? current ?? 0;
}
