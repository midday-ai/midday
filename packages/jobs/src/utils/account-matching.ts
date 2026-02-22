import {
  type ApiAccount,
  type DbAccount,
  findMatchingAccount,
  type MatchingResult,
} from "@midday/supabase/account-matching";
import { createClient } from "@midday/supabase/job";
import { logger } from "@trigger.dev/sdk";

// Re-export types for convenience
export type { ApiAccount, DbAccount, MatchingResult };
export { findMatchingAccount };

/**
 * Matches API accounts to existing database accounts and updates their account_id.
 *
 * Uses findMatchingAccount from @midday/supabase for the pure matching logic,
 * then handles the database updates and logging.
 */
export async function matchAndUpdateAccountIds({
  existingAccounts,
  apiAccounts,
  connectionId,
  provider,
}: {
  existingAccounts: DbAccount[];
  apiAccounts: ApiAccount[];
  connectionId: string;
  provider: string;
}): Promise<MatchingResult> {
  const supabase = createClient();
  const matchedDbIds = new Set<string>();
  const results: MatchingResult = { matched: 0, unmatched: 0, errors: 0 };

  for (const apiAccount of apiAccounts) {
    const match = findMatchingAccount(
      apiAccount,
      existingAccounts,
      matchedDbIds,
    );

    if (match) {
      matchedDbIds.add(match.id);

      const updates: Record<string, string | null> = {
        account_id: apiAccount.id,
      };
      if (apiAccount.resource_id) {
        updates.account_reference = apiAccount.resource_id;
      }
      if (apiAccount.iban) {
        updates.iban = apiAccount.iban;
      }

      const { error } = await supabase
        .from("bank_accounts")
        .update(updates)
        .eq("id", match.id);

      if (error) {
        logger.warn(`Failed to update ${provider} account`, {
          resource_id: apiAccount.resource_id,
          dbAccountId: match.id,
          error: error.message,
        });
        results.errors++;
      } else {
        results.matched++;
      }
    } else {
      logger.warn(`No matching DB account found for ${provider} account`, {
        resource_id: apiAccount.resource_id,
        iban: apiAccount.iban,
        type: apiAccount.type,
        currency: apiAccount.currency,
        name: apiAccount.name,
      });
      results.unmatched++;
    }
  }

  logger.info(`Account matching complete for ${provider}`, {
    connectionId,
    ...results,
    totalApiAccounts: apiAccounts.length,
    totalDbAccounts: existingAccounts.length,
  });

  // Warn if some existing DB accounts were not matched to any API account
  // This could indicate accounts were removed at the bank or data mismatch
  if (results.matched < existingAccounts.length) {
    logger.warn("Some existing accounts were not matched", {
      connectionId,
      provider,
      existingCount: existingAccounts.length,
      matchedCount: results.matched,
      unmatchedDbAccounts: existingAccounts.length - results.matched,
    });
  }

  return results;
}
