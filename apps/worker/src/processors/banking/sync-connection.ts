import {
  checkAllAccountsFailed,
  getBankAccountsForSync,
  getBankConnectionForSync,
  updateBankConnectionStatus,
} from "@midday/db/queries";
import { triggerJob, triggerJobAndWait } from "@midday/job-client";
import type { Job } from "bullmq";
import { trpc } from "../../client/trpc";
import {
  type SyncConnectionPayload,
  syncConnectionSchema,
} from "../../schemas/banking";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Syncs a bank connection by:
 * 1. Checking connection status with the provider
 * 2. Updating connection status in DB
 * 3. Fan-out to sync each enabled account (sequential with delays)
 * 4. Check if all accounts failed and disconnect if needed
 * 5. Trigger transaction notifications (delayed)
 */
export class SyncConnectionProcessor extends BaseProcessor<SyncConnectionPayload> {
  protected getPayloadSchema() {
    return syncConnectionSchema;
  }

  async process(job: Job<SyncConnectionPayload>): Promise<void> {
    const { connectionId, manualSync } = job.data;
    const db = getDb();

    // 1. Get connection details
    const connection = await getBankConnectionForSync(db, { connectionId });

    if (!connection) {
      this.logger.error("Connection not found", { connectionId });
      throw new Error("Connection not found");
    }

    const { provider, referenceId, accessToken, teamId } = connection;

    // 2. Check connection status with provider
    const connectionStatus =
      await trpc.bankingService.getConnectionStatus.query({
        provider: provider as
          | "gocardless"
          | "plaid"
          | "teller"
          | "enablebanking",
        id: referenceId ?? undefined,
        accessToken: accessToken ?? undefined,
      });

    this.logger.info("Connection status from provider", {
      connectionId,
      status: connectionStatus.status,
    });

    // 3. Handle disconnected status
    if (connectionStatus.status === "disconnected") {
      this.logger.info("Connection disconnected", { connectionId });

      await updateBankConnectionStatus(db, {
        id: connectionId,
        status: "disconnected",
      });

      return;
    }

    // 4. Update connection status to connected
    await updateBankConnectionStatus(db, {
      id: connectionId,
      status: "connected",
      lastAccessed: true,
    });

    // 5. Get accounts to sync
    const accounts = await getBankAccountsForSync(db, {
      connectionId,
      // Skip accounts with high error retries for background sync
      excludeHighErrorAccounts: !manualSync,
    });

    if (accounts.length === 0) {
      this.logger.info("No accounts to sync", { connectionId });
      return;
    }

    this.logger.info("Syncing accounts", {
      connectionId,
      accountCount: accounts.length,
      manualSync,
    });

    // 6. Sync each account sequentially with delays to avoid rate limiting
    const delayMs = manualSync ? 30_000 : 60_000; // 30s for manual, 60s for background

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      if (!account) continue;

      try {
        await triggerJobAndWait(
          "sync-account",
          {
            id: account.id,
            teamId: account.teamId,
            accountId: account.accountId,
            accessToken: account.bankConnection?.accessToken ?? undefined,
            errorRetries: account.errorRetries ?? undefined,
            provider: account.bankConnection?.provider as
              | "gocardless"
              | "plaid"
              | "teller"
              | "enablebanking",
            manualSync,
            accountType: account.type ?? "depository",
          },
          "banking",
          { timeout: 120_000 }, // 2 minute timeout per account
        );

        // Add delay between accounts (except for the last one)
        if (i < accounts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        this.logger.error("Failed to sync account", {
          accountId: account.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        // Continue with other accounts even if one fails
      }
    }

    this.logger.info("Account sync completed", { connectionId });

    // 7. Check if all accounts failed - disconnect if so
    const allFailed = await checkAllAccountsFailed(db, { connectionId });

    if (allFailed) {
      this.logger.info("All accounts have errors, disconnecting connection", {
        connectionId,
      });

      await updateBankConnectionStatus(db, {
        id: connectionId,
        status: "disconnected",
      });
    }

    // 8. Trigger transaction notifications (delayed 5 minutes for background sync)
    if (!manualSync) {
      await triggerJob(
        "transaction-notifications",
        { teamId },
        "banking",
        { delay: 5 * 60 * 1000 }, // 5 minutes
      );
    }
  }
}
