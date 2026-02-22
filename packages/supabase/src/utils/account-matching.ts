export type DbAccount = {
  id: string;
  account_reference: string | null;
  iban: string | null;
  type: string | null;
  currency: string | null;
  name: string | null;
};

export type ApiAccount = {
  id: string;
  resource_id: string | null;
  iban: string | null;
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
 * Finds the best matching DB account for an API account using a tiered strategy:
 *
 * 1. resource_id / account_reference — the identifier we already track
 * 2. IBAN — stable bank-side identifier (fallback for old accounts missing account_reference)
 * 3. Fuzzy — currency + type, preferring name match (for accounts like PayPal
 *    that lack both resource_id and IBAN)
 *
 * Each DB account can only be matched once (tracked via matchedDbIds).
 */
export function findMatchingAccount(
  apiAccount: ApiAccount,
  existingAccounts: DbAccount[],
  matchedDbIds: Set<string>,
): DbAccount | null {
  const available = existingAccounts.filter((a) => !matchedDbIds.has(a.id));

  // Tier 1: resource_id / account_reference match
  if (apiAccount.resource_id) {
    const byRef = available.filter(
      (db) =>
        db.account_reference && db.account_reference === apiAccount.resource_id,
    );
    if (byRef.length === 1) return byRef[0]!;
    if (byRef.length > 1) {
      return pickBestCandidate(byRef, apiAccount);
    }
  }

  // Tier 2: IBAN match (for old accounts that predate account_reference storage)
  if (apiAccount.iban) {
    const byIban = available.filter(
      (db) => db.iban && db.iban === apiAccount.iban,
    );
    if (byIban.length === 1) return byIban[0]!;
    if (byIban.length > 1) {
      return pickBestCandidate(byIban, apiAccount);
    }
  }

  // Tier 3: fuzzy — currency + type, prefer name match
  // "XXX" (ISO 4217 "no currency") is treated as unknown — don't reject on it
  const hasRealCurrency = (c: string | null) =>
    !!c && c.toUpperCase() !== "XXX";

  const byCurrencyAndType = available.filter((db) => {
    if (
      hasRealCurrency(db.currency) &&
      hasRealCurrency(apiAccount.currency) &&
      db.currency !== apiAccount.currency
    )
      return false;
    if (db.type && db.type !== apiAccount.type) return false;
    return true;
  });

  if (byCurrencyAndType.length === 1) return byCurrencyAndType[0]!;
  if (byCurrencyAndType.length > 1) {
    return pickBestCandidate(byCurrencyAndType, apiAccount);
  }

  return null;
}

function pickBestCandidate(
  candidates: DbAccount[],
  apiAccount: ApiAccount,
): DbAccount {
  const nameMatch = candidates.find(
    (c) => c.name?.toLowerCase() === apiAccount.name?.toLowerCase(),
  );
  return nameMatch ?? candidates[0]!;
}
