import {
  getExistingAccountsForReconnect,
  updateBankAccountId,
  updateBankConnectionReference,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import { trpc } from "../../client/trpc";
import {
  type ReconnectConnectionPayload,
  reconnectConnectionSchema,
} from "../../schemas/banking";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

type ApiAccount = {
  id: string;
  resource_id?: string | null;
  type?: string | null;
  currency?: string | null;
  name?: string | null;
};

type DbAccount = {
  id: string;
  accountReference?: string | null;
  type?: string | null;
  currency?: string | null;
  name?: string | null;
};

type MatchResult = {
  matched: number;
  unmatched: number;
  errors: number;
};

/**
 * Find a matching DB account for an API account.
 * Uses resource_id matching first, then falls back to type+currency+name.
 */
function findMatchingAccount(
  apiAccount: ApiAccount,
  existingAccounts: DbAccount[],
  matchedDbIds: Set<string>,
): DbAccount | null {
  // First, try exact resource_id match
  if (apiAccount.resource_id) {
    const exactMatch = existingAccounts.find(
      (dbAccount) =>
        dbAccount.accountReference === apiAccount.resource_id &&
        !matchedDbIds.has(dbAccount.id),
    );
    if (exactMatch) return exactMatch;
  }

  // Fallback: match by type + currency + name
  const fuzzyMatch = existingAccounts.find(
    (dbAccount) =>
      !matchedDbIds.has(dbAccount.id) &&
      dbAccount.type === apiAccount.type &&
      dbAccount.currency === apiAccount.currency &&
      dbAccount.name === apiAccount.name,
  );

  return fuzzyMatch ?? null;
}

/**
 * Handles bank reconnection by matching new account IDs to existing accounts.
 * After matching, triggers a sync to fetch latest data.
 */
export class ReconnectConnectionProcessor extends BaseProcessor<ReconnectConnectionPayload> {
  protected getPayloadSchema() {
    return reconnectConnectionSchema;
  }

  async process(job: Job<ReconnectConnectionPayload>): Promise<void> {
    const { teamId, connectionId, provider } = job.data;
    const db = getDb();

    this.logger.info("Processing reconnection", {
      teamId,
      connectionId,
      provider,
    });

    // Get existing accounts for this connection
    const existingAccounts = await getExistingAccountsForReconnect(db, {
      connectionId,
      teamId,
    });

    if (!existingAccounts || existingAccounts.length === 0) {
      this.logger.warn("No existing accounts found for connection", {
        connectionId,
        provider,
      });
    }

    // Provider-specific reconnection logic
    if (provider === "gocardless") {
      await this.handleGoCardlessReconnect(
        db,
        teamId,
        connectionId,
        existingAccounts,
      );
    } else if (provider === "teller") {
      await this.handleTellerReconnect(
        db,
        teamId,
        connectionId,
        existingAccounts,
      );
    } else if (provider === "enablebanking") {
      await this.handleEnableBankingReconnect(
        db,
        teamId,
        connectionId,
        existingAccounts,
      );
    } else if (provider === "plaid") {
      // Plaid uses "update mode" which preserves account IDs
      this.logger.info(
        "Plaid reconnect - account IDs preserved via update mode",
        {
          connectionId,
        },
      );
    }

    // Trigger sync to fetch latest data
    await triggerJob(
      "sync-connection",
      {
        connectionId,
        manualSync: true,
      },
      "banking",
    );

    this.logger.info("Reconnection complete, sync triggered", {
      connectionId,
    });
  }

  private async handleGoCardlessReconnect(
    db: ReturnType<typeof getDb>,
    teamId: string,
    connectionId: string,
    existingAccounts: DbAccount[],
  ): Promise<void> {
    // Get the new connection reference from GoCardless
    const connectionResponse =
      await trpc.bankingService.getConnectionByReference.query({
        reference: teamId,
      });

    if (!connectionResponse) {
      throw new Error("GoCardless connection not found");
    }

    const referenceId = connectionResponse.id;

    // Update the reference_id
    if (referenceId) {
      await updateBankConnectionReference(db, {
        connectionId,
        teamId,
        referenceId,
      });

      this.logger.info("Updated GoCardless reference_id", {
        connectionId,
        referenceId,
      });
    }

    // Fetch fresh accounts and match
    const accountsData = await trpc.bankingService.getAccounts.query({
      id: referenceId,
      provider: "gocardless",
    });

    if (
      accountsData &&
      accountsData.length > 0 &&
      existingAccounts.length > 0
    ) {
      await this.matchAndUpdateAccountIds(
        db,
        existingAccounts,
        accountsData,
        connectionId,
        "gocardless",
      );
    }
  }

  private async handleTellerReconnect(
    db: ReturnType<typeof getDb>,
    teamId: string,
    connectionId: string,
    existingAccounts: DbAccount[],
  ): Promise<void> {
    // For Teller, we need to get the connection details from our DB
    // The access token should already be updated by the reconnect flow
    const accountsData = await trpc.bankingService.getAccounts.query({
      id: connectionId, // Teller uses enrollment_id
      provider: "teller",
    });

    if (
      accountsData &&
      accountsData.length > 0 &&
      existingAccounts.length > 0
    ) {
      await this.matchAndUpdateAccountIds(
        db,
        existingAccounts,
        accountsData,
        connectionId,
        "teller",
      );
    }
  }

  private async handleEnableBankingReconnect(
    db: ReturnType<typeof getDb>,
    teamId: string,
    connectionId: string,
    existingAccounts: DbAccount[],
  ): Promise<void> {
    // For EnableBanking, reference_id should already be updated
    const accountsData = await trpc.bankingService.getAccounts.query({
      id: connectionId, // Uses reference_id
      provider: "enablebanking",
    });

    if (
      accountsData &&
      accountsData.length > 0 &&
      existingAccounts.length > 0
    ) {
      await this.matchAndUpdateAccountIds(
        db,
        existingAccounts,
        accountsData,
        connectionId,
        "enablebanking",
      );
    }
  }

  private async matchAndUpdateAccountIds(
    db: ReturnType<typeof getDb>,
    existingAccounts: DbAccount[],
    apiAccounts: ApiAccount[],
    connectionId: string,
    provider: string,
  ): Promise<MatchResult> {
    const matchedDbIds = new Set<string>();
    const results: MatchResult = { matched: 0, unmatched: 0, errors: 0 };

    for (const apiAccount of apiAccounts) {
      if (!apiAccount.resource_id) {
        this.logger.debug("Skipping API account without resource_id", {
          accountId: apiAccount.id,
          provider,
        });
        continue;
      }

      const match = findMatchingAccount(
        apiAccount,
        existingAccounts,
        matchedDbIds,
      );

      if (match) {
        matchedDbIds.add(match.id);

        const result = await updateBankAccountId(db, {
          id: match.id,
          accountId: apiAccount.id,
        });

        if (result) {
          results.matched++;
        } else {
          this.logger.warn("Failed to update account ID", {
            dbAccountId: match.id,
            newAccountId: apiAccount.id,
            provider,
          });
          results.errors++;
        }
      } else {
        this.logger.warn("No matching DB account found", {
          resourceId: apiAccount.resource_id,
          type: apiAccount.type,
          currency: apiAccount.currency,
          provider,
        });
        results.unmatched++;
      }
    }

    this.logger.info("Account matching complete", {
      connectionId,
      provider,
      ...results,
      totalApiAccounts: apiAccounts.length,
      totalDbAccounts: existingAccounts.length,
    });

    return results;
  }
}
