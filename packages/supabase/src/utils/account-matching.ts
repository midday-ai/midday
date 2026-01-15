export type DbAccount = {
  id: string;
  account_reference: string | null;
  type: string | null;
  currency: string | null;
  name: string | null;
};

export type ApiAccount = {
  id: string;
  resource_id: string | null;
  type: string;
  currency: string;
  name: string;
};

export type MatchingResult = {
  matched: number;
  unmatched: number;
  errors: number;
};

/**
 * Finds the best matching DB account for an API account.
 * Returns null if no match is found.
 *
 * The matching algorithm:
 * 1. Filter by resource_id (account_reference) - must match exactly
 * 2. Filter by type if available on both sides
 * 3. Filter by currency if available on both sides
 * 4. If multiple candidates remain, prefer exact name match
 * 5. Each DB account can only be matched once (tracked via matchedDbIds)
 *
 * This prevents the issue where accounts with the same last_four digits
 * would all get updated to the same account_id.
 */
export function findMatchingAccount(
  apiAccount: ApiAccount,
  existingAccounts: DbAccount[],
  matchedDbIds: Set<string>,
): DbAccount | null {
  if (!apiAccount.resource_id) {
    return null;
  }

  // Find candidates that match on resource_id and haven't been matched yet
  const candidates = existingAccounts.filter((dbAccount) => {
    if (matchedDbIds.has(dbAccount.id)) return false;
    if (dbAccount.account_reference !== apiAccount.resource_id) return false;
    if (dbAccount.type && dbAccount.type !== apiAccount.type) return false;
    if (dbAccount.currency && dbAccount.currency !== apiAccount.currency)
      return false;
    return true;
  });

  // If multiple candidates, prefer exact name match
  const match = candidates.find(
    (c) => c.name?.toLowerCase() === apiAccount.name?.toLowerCase(),
  );

  // Otherwise take the first candidate
  return match ?? candidates[0] ?? null;
}
