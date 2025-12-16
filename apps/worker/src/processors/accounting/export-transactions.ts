import {
  getTransactionsForAccountingSync,
  upsertAccountingSyncRecord,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import type { AccountingExportPayload } from "../../schemas/accounting";
import { AccountingProcessorBase, type AccountingProviderId } from "./base";

// Process transactions in batches
const BATCH_SIZE = 50;

/**
 * Export transactions to accounting provider processor
 * Manual export of selected transactions to the accounting provider
 */
export class ExportTransactionsProcessor extends AccountingProcessorBase<AccountingExportPayload> {
  async process(job: Job<AccountingExportPayload>): Promise<{
    teamId: string;
    providerId: string;
    exportedCount: number;
    failedCount: number;
    exportedAt: string;
  }> {
    const { teamId, userId, providerId, transactionIds, includeAttachments } =
      job.data;

    this.logger.info("Starting manual accounting export", {
      teamId,
      userId,
      providerId,
      transactionCount: transactionIds.length,
      includeAttachments,
    });

    if (transactionIds.length === 0) {
      return {
        teamId,
        providerId,
        exportedCount: 0,
        failedCount: 0,
        exportedAt: new Date().toISOString(),
      };
    }

    // Initialize provider with valid tokens
    const { provider, config, db } = await this.initializeProvider(
      teamId,
      providerId,
    );

    // Get target bank account (use provider-agnostic org ID)
    const orgId = this.getOrgIdFromConfig(config);
    const targetAccount = await this.getTargetAccount(provider, orgId, config);

    // Fetch transactions using db package
    // Note: For export, we include the specific transaction IDs regardless of sync status
    const transactions = await getTransactionsForAccountingSync(db, {
      teamId,
      provider: providerId as AccountingProviderId,
      transactionIds,
      sinceDaysAgo: 365, // Look back a full year for manual exports
      limit: transactionIds.length,
    });

    if (transactions.length === 0) {
      this.logger.warn("No transactions found for export", {
        teamId,
        transactionIds,
      });
      return {
        teamId,
        providerId,
        exportedCount: 0,
        failedCount: 0,
        exportedAt: new Date().toISOString(),
      };
    }

    // Map transactions to provider format
    const mappedTransactions = this.mapTransactionsToProvider(transactions);

    // Export transactions in batches
    let totalExported = 0;
    let totalFailed = 0;

    for (let i = 0; i < mappedTransactions.length; i += BATCH_SIZE) {
      const batch = mappedTransactions.slice(i, i + BATCH_SIZE);

      try {
        const result = await provider.syncTransactions({
          transactions: batch,
          targetAccountId: targetAccount.id,
          tenantId: orgId,
        });

        totalExported += result.syncedCount;
        totalFailed += result.failedCount;

        // Create sync records for each transaction
        for (const txResult of result.results) {
          await upsertAccountingSyncRecord(db, {
            transactionId: txResult.transactionId,
            teamId,
            provider: providerId as AccountingProviderId,
            providerTenantId: orgId,
            providerTransactionId: txResult.providerTransactionId,
            syncType: "manual",
            status: txResult.success ? "synced" : "failed",
            errorMessage: txResult.error,
            providerEntityType: txResult.providerEntityType,
          });

          // Trigger attachment sync if enabled and transaction has attachments
          if (
            txResult.success &&
            txResult.providerTransactionId &&
            includeAttachments
          ) {
            const originalTx = transactions.find(
              (t) => t.id === txResult.transactionId,
            );
            const attachments =
              originalTx?.attachments?.filter((a) => a.name !== null) ?? [];

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

        this.logger.info("Export batch completed", {
          teamId,
          providerId,
          batchIndex: Math.floor(i / BATCH_SIZE) + 1,
          exported: result.syncedCount,
          failed: result.failedCount,
        });
      } catch (error) {
        this.logger.error("Export batch failed", {
          teamId,
          providerId,
          batchIndex: Math.floor(i / BATCH_SIZE) + 1,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        totalFailed += batch.length;

        for (const tx of batch) {
          await upsertAccountingSyncRecord(db, {
            transactionId: tx.id,
            teamId,
            provider: providerId as AccountingProviderId,
            providerTenantId: orgId,
            syncType: "manual",
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

    this.logger.info("Manual accounting export completed", {
      teamId,
      userId,
      providerId,
      totalExported,
      totalFailed,
      total: mappedTransactions.length,
    });

    return {
      teamId,
      providerId,
      exportedCount: totalExported,
      failedCount: totalFailed,
      exportedAt: new Date().toISOString(),
    };
  }
}
