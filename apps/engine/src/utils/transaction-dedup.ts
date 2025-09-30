/**
 * Transaction deduplication utilities following Enable Banking's official best practices.
 *
 * Reference: https://enablebanking.com/blog/2024/10/29/how-to-sync-account-transactions-from-open-banking-apis-without-unique-transaction-ids
 *
 * Enable Banking recommends using "fundamental values" that never change:
 * - booking_date: The date when the transaction is officially recorded
 * - transaction_amount: The monetary value (absolute)
 * - credit_debit_indicator: Direction of transaction (credit/debit)
 *
 * These values remain constant even when other transaction properties may change.
 */

/**
 * Minimal transaction interface for deduplication.
 * Works with any transaction object that has these properties.
 */
export interface DeduplicatableTransaction {
  booking_date?: string;
  value_date?: string;
  transaction_amount: number | { amount: string; currency: string };
  [key: string]: any;
}

/**
 * Creates a unique composite key for a transaction using fundamental values.
 *
 * The key is composed of:
 * - Booking date (or value date as fallback)
 * - Absolute transaction amount
 * - Credit/Debit indicator (derived from amount sign)
 *
 * These values never change according to Enable Banking's documentation,
 * making them reliable for duplicate detection even when transaction_id is null.
 *
 * @param transaction - The transaction object
 * @returns A unique string key for the transaction
 */
export function createTransactionKey(
  transaction: DeduplicatableTransaction,
): string {
  const date = transaction.booking_date || transaction.value_date;

  // Handle both number and object transaction_amount formats
  const amountValue =
    typeof transaction.transaction_amount === "number"
      ? transaction.transaction_amount
      : Number.parseFloat(transaction.transaction_amount.amount);

  const amount = Math.abs(amountValue || 0);
  const indicator = amountValue >= 0 ? "CRDT" : "DBIT";

  return `${date}-${amount}-${indicator}`;
}

/**
 * Merges two lists of transactions, removing duplicates.
 *
 * This function is useful when fetching transactions from multiple API calls
 * (e.g., historical + recent data) and needing to combine them without duplicates.
 *
 * @param existingTransactions - Transactions already fetched
 * @param newTransactions - New transactions to merge
 * @returns Combined list with duplicates removed
 */
export function mergeTransactions<T extends DeduplicatableTransaction>(
  existingTransactions: T[],
  newTransactions: T[],
): T[] {
  const existingKeys = new Set(existingTransactions.map(createTransactionKey));

  const uniqueNewTransactions = newTransactions.filter(
    (t) => !existingKeys.has(createTransactionKey(t)),
  );

  return [...existingTransactions, ...uniqueNewTransactions];
}

/**
 * Finds duplicate transactions in a list based on fundamental values.
 *
 * Useful for debugging or data validation.
 *
 * @param transactions - List of transactions to check
 * @returns Array of transaction keys that appear more than once
 */
export function findDuplicateTransactions(
  transactions: DeduplicatableTransaction[],
): string[] {
  const keyCount = new Map<string, number>();

  for (const transaction of transactions) {
    const key = createTransactionKey(transaction);
    keyCount.set(key, (keyCount.get(key) || 0) + 1);
  }

  return Array.from(keyCount.entries())
    .filter(([_, count]) => count > 1)
    .map(([key, _]) => key);
}
