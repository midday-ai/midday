import {
  clearBankAccountErrors,
  incrementBankAccountErrors,
  updateBankAccountBalance,
} from "@midday/db/queries";
import { triggerJobAndWait } from "@midday/job-client";
import type { Job } from "bullmq";
import { trpc } from "../../client/trpc";
import {
  syncAccountSchema,
  type SyncAccountPayload,
} from "../../schemas/banking";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

const BATCH_SIZE = 500;

/**
 * Maps account type to classification for transactions API
 */
function getClassification(
  type: "depository" | "credit" | "other_asset" | "loan" | "other_liability",
): "depository" | "credit" {
  return type === "credit" ? "credit" : "depository";
}

/**
 * Syncs a single bank account:
 * 1. Fetch and update balance
 * 2. Fetch transactions
 * 3. Upsert transactions in batches
 */
export class SyncAccountProcessor extends BaseProcessor<SyncAccountPayload> {
  protected getPayloadSchema() {
    return syncAccountSchema;
  }

  async process(job: Job<SyncAccountPayload>): Promise<void> {
    const {
      id,
      teamId,
      accountId,
      accountType,
      accessToken,
      errorRetries,
      provider,
      manualSync,
    } = job.data;

    const db = getDb();
    const classification = getClassification(accountType);

    // 1. Sync balance
    try {
      const balanceData = await trpc.bankingService.getAccountBalance.query({
        provider,
        accountId,
        accessToken,
        accountType,
      });

      const balance = balanceData?.amount ?? null;

      if (balance !== null) {
        await updateBankAccountBalance(db, {
          id,
          balance,
          availableBalance: balanceData?.available_balance ?? null,
          creditLimit: balanceData?.credit_limit ?? null,
          clearErrors: true,
        });

        this.logger.info("Balance synced", {
          accountId: id,
          balance,
        });
      } else {
        // Clear errors even if balance is null
        await clearBankAccountErrors(db, { id });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error("Failed to sync balance", {
        accountId: id,
        error: errorMessage,
      });

      // Check if this is a disconnection error
      const isDisconnected =
        errorMessage.includes("disconnected") ||
        errorMessage.includes("unauthorized") ||
        errorMessage.includes("invalid_token");

      if (isDisconnected) {
        await incrementBankAccountErrors(db, {
          id,
          errorDetails: errorMessage,
          currentRetries: errorRetries,
        });

        throw error; // Re-throw to mark job as failed
      }
    }

    // 2. Sync transactions
    try {
      const transactionsData = await trpc.bankingService.getTransactions.query({
        provider,
        accountId,
        accountType: classification,
        accessToken,
        // Manual sync fetches all transactions, background sync fetches latest only
        latest: !manualSync,
      });

      // Clear errors on successful transaction fetch
      await clearBankAccountErrors(db, { id });

      if (!transactionsData || transactionsData.length === 0) {
        this.logger.info("No transactions to sync", { accountId: id });
        return;
      }

      this.logger.info("Fetched transactions", {
        accountId: id,
        count: transactionsData.length,
      });

      // 3. Ensure merchant_name is included
      const mappedTransactions = transactionsData.map((tx) => ({
        ...tx,
        merchant_name: tx.merchant_name ?? null,
      }));

      // 4. Upsert transactions in batches
      for (let i = 0; i < mappedTransactions.length; i += BATCH_SIZE) {
        const batch = mappedTransactions.slice(i, i + BATCH_SIZE);

        await triggerJobAndWait(
          "upsert-transactions",
          {
            transactions: batch,
            teamId,
            bankAccountId: id,
            manualSync,
          },
          "banking",
          { timeout: 60_000 }, // 1 minute per batch
        );

        this.logger.info("Upserted transaction batch", {
          accountId: id,
          batchIndex: Math.floor(i / BATCH_SIZE) + 1,
          batchSize: batch.length,
        });
      }

      this.logger.info("Transaction sync complete", {
        accountId: id,
        totalTransactions: mappedTransactions.length,
      });
    } catch (error) {
      this.logger.error("Failed to sync transactions", {
        accountId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }
}
