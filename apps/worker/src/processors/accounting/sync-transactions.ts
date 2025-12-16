import type { Database } from "@midday/db/client";
import {
  getSyncedTransactionsWithAttachmentChanges,
  getTransactionsForAccountingSync,
  upsertAccountingSyncRecord,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import type { AccountingSyncPayload } from "../../schemas/accounting";
import { AccountingProcessorBase, type AccountingProviderId } from "./base";

// Process transactions in batches
const BATCH_SIZE = 50;

/**
 * Sync transactions to accounting provider processor
 * Fetches unsynced transactions from Midday and pushes them to the accounting provider
 */
export class SyncTransactionsProcessor extends AccountingProcessorBase<AccountingSyncPayload> {
  async process(job: Job<AccountingSyncPayload>): Promise<{
    teamId: string;
    providerId: string;
    syncedCount: number;
    failedCount: number;
    syncedAt: string;
  }> {
    const {
      teamId,
      providerId,
      transactionIds,
      includeAttachments = true,
      manualSync = false,
    } = job.data;

    this.logger.info("Starting accounting sync", {
      teamId,
      providerId,
      transactionIdsProvided: transactionIds?.length ?? "all unsynced",
      includeAttachments,
      manualSync,
    });

    // Initialize provider with valid tokens
    const { provider, config, db } = await this.initializeProvider(
      teamId,
      providerId,
    );

    // Get target bank account (use provider-agnostic org ID, use default if configured)
    const orgId = this.getOrgIdFromConfig(config);
    const targetAccount = await this.getTargetAccount(provider, orgId, config);

    // Get transactions for sync using db package
    const transactions = await getTransactionsForAccountingSync(db, {
      teamId,
      provider: providerId as AccountingProviderId,
      transactionIds,
      sinceDaysAgo: manualSync ? 365 : 30, // Longer history for manual sync
      limit: 500,
    });

    if (transactions.length === 0) {
      this.logger.info("No transactions to sync", { teamId, providerId });
      return {
        teamId,
        providerId,
        syncedCount: 0,
        failedCount: 0,
        syncedAt: new Date().toISOString(),
      };
    }

    this.logger.info("Fetched transactions to sync", {
      teamId,
      providerId,
      count: transactions.length,
    });

    // Map transactions to provider format
    const mappedTransactions = this.mapTransactionsToProvider(transactions);

    // Sync transactions in batches
    let totalSynced = 0;
    let totalFailed = 0;

    for (let i = 0; i < mappedTransactions.length; i += BATCH_SIZE) {
      const batch = mappedTransactions.slice(i, i + BATCH_SIZE);

      try {
        const result = await provider.syncTransactions({
          transactions: batch,
          targetAccountId: targetAccount.id,
          tenantId: orgId,
        });

        totalSynced += result.syncedCount;
        totalFailed += result.failedCount;

        // Create sync records for each transaction using db package
        for (const txResult of result.results) {
          // Get original transaction to track synced attachment IDs
          const originalTx = transactions.find(
            (t) => t.id === txResult.transactionId,
          );
          const attachments =
            originalTx?.attachments?.filter((a) => a.name !== null) ?? [];

          await upsertAccountingSyncRecord(db, {
            transactionId: txResult.transactionId,
            teamId,
            provider: providerId as AccountingProviderId,
            providerTenantId: orgId,
            providerTransactionId: txResult.providerTransactionId,
            // Track which attachments are synced (empty initially, filled after attachment sync)
            syncedAttachmentIds: [],
            syncType: manualSync ? "manual" : "auto",
            status: txResult.success ? "synced" : "failed",
            errorMessage: txResult.error,
          });

          // Trigger attachment sync if enabled and transaction has attachments
          if (
            txResult.success &&
            txResult.providerTransactionId &&
            includeAttachments
          ) {
            if (attachments.length > 0) {
              await triggerJob(
                "sync-accounting-attachments",
                {
                  teamId,
                  providerId,
                  transactionId: txResult.transactionId,
                  providerTransactionId: txResult.providerTransactionId,
                  attachmentIds: attachments.map((a) => a.id),
                  // Pass entity type to avoid extra API lookup for QuickBooks
                  providerEntityType: txResult.providerEntityType,
                },
                "accounting",
              );
            }
          }
        }

        this.logger.info("Batch sync completed", {
          teamId,
          providerId,
          batchIndex: Math.floor(i / BATCH_SIZE) + 1,
          batchSize: batch.length,
          synced: result.syncedCount,
          failed: result.failedCount,
        });
      } catch (error) {
        this.logger.error("Batch sync failed", {
          teamId,
          providerId,
          batchIndex: Math.floor(i / BATCH_SIZE) + 1,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        // Mark all transactions in batch as failed
        totalFailed += batch.length;

        for (const tx of batch) {
          await upsertAccountingSyncRecord(db, {
            transactionId: tx.id,
            teamId,
            provider: providerId as AccountingProviderId,
            providerTenantId: orgId,
            syncType: manualSync ? "manual" : "auto",
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Update progress
      const progress = Math.round(
        ((i + batch.length) / mappedTransactions.length) * 100,
      );
      await this.updateProgress(job, progress);
    }

    this.logger.info("New transaction sync completed", {
      teamId,
      providerId,
      totalSynced,
      totalFailed,
      total: mappedTransactions.length,
    });

    // Check for attachment updates on already-synced transactions
    // This handles the case where a user adds/replaces attachments on a synced transaction
    if (includeAttachments && !transactionIds) {
      await this.syncAttachmentUpdates(
        db,
        teamId,
        providerId as AccountingProviderId,
      );
    }

    return {
      teamId,
      providerId,
      syncedCount: totalSynced,
      failedCount: totalFailed,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Sync attachment updates for already-synced transactions
   * Only pushes NEW attachments, doesn't delete removed ones
   */
  private async syncAttachmentUpdates(
    db: Database,
    teamId: string,
    providerId: AccountingProviderId,
  ): Promise<void> {
    const transactionsWithChanges =
      await getSyncedTransactionsWithAttachmentChanges(db, {
        teamId,
        provider: providerId,
        sinceDaysAgo: 30,
        limit: 100,
      });

    if (transactionsWithChanges.length === 0) {
      this.logger.info("No attachment updates to sync", { teamId, providerId });
      return;
    }

    this.logger.info("Found transactions with new attachments", {
      teamId,
      providerId,
      count: transactionsWithChanges.length,
    });

    // Trigger attachment sync jobs for each transaction with new attachments
    for (const tx of transactionsWithChanges) {
      await triggerJob(
        "sync-accounting-attachments",
        {
          teamId,
          providerId,
          transactionId: tx.transactionId,
          providerTransactionId: tx.providerTransactionId,
          attachmentIds: tx.newAttachmentIds,
          // Pass existing synced IDs so attachment processor can update the full list
          existingSyncedAttachmentIds: tx.syncedAttachmentIds,
          syncRecordId: tx.syncRecordId,
        },
        "accounting",
      );

      this.logger.info("Triggered attachment update sync", {
        teamId,
        providerId,
        transactionId: tx.transactionId,
        newAttachmentCount: tx.newAttachmentIds.length,
      });
    }
  }
}
