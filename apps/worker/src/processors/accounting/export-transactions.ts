import {
  type AccountingSyncRecord,
  getAccountingSyncStatus,
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
 * Categorized transaction for processing
 */
interface CategorizedTransaction {
  /** Transactions to export (not synced yet or previously failed) */
  toExport: string[];
  /** Transactions that are already synced but have attachment changes */
  toSyncAttachments: Array<{
    transactionId: string;
    providerTransactionId: string;
    syncRecord: AccountingSyncRecord;
    newAttachmentIds: string[];
    removedAttachments: Array<{ middayId: string; providerId: string | null }>;
  }>;
  /** Transactions already complete (synced, no changes) */
  alreadyComplete: string[];
}

/**
 * Export transactions to accounting provider processor
 * Manual export of selected transactions to the accounting provider
 *
 * Smart idempotent export:
 * - New transactions: Create voucher + upload attachments
 * - Already synced with attachment changes: Only sync attachments (no duplicate voucher)
 * - Already synced, no changes: Skip
 */
export class ExportTransactionsProcessor extends AccountingProcessorBase<AccountingExportPayload> {
  async process(job: Job<AccountingExportPayload>): Promise<{
    teamId: string;
    providerId: string;
    exportedCount: number;
    attachmentsSyncedCount: number;
    skippedCount: number;
    failedCount: number;
    exportedAt: string;
  }> {
    const { teamId, userId, providerId, transactionIds } = job.data;

    this.logger.info("Starting manual accounting export", {
      teamId,
      userId,
      providerId,
      transactionCount: transactionIds.length,
    });

    if (transactionIds.length === 0) {
      return {
        teamId,
        providerId,
        exportedCount: 0,
        attachmentsSyncedCount: 0,
        skippedCount: 0,
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
        attachmentsSyncedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        exportedAt: new Date().toISOString(),
      };
    }

    // Fetch existing sync status for all transactions
    const syncRecords = await getAccountingSyncStatus(db, {
      teamId,
      transactionIds,
      provider: providerId as AccountingProviderId,
    });

    // Create a map for quick lookup
    const syncRecordMap = new Map<string, AccountingSyncRecord>();
    for (const record of syncRecords) {
      syncRecordMap.set(record.transactionId, record as AccountingSyncRecord);
    }

    // Categorize transactions
    const categorized = this.categorizeTransactions(
      transactions,
      syncRecordMap,
    );

    this.logger.info("Transactions categorized", {
      teamId,
      providerId,
      toExport: categorized.toExport.length,
      toSyncAttachments: categorized.toSyncAttachments.length,
      alreadyComplete: categorized.alreadyComplete.length,
    });

    let totalExported = 0;
    let totalFailed = 0;
    let totalAttachmentsSynced = 0;

    // Step 1: Export new transactions
    if (categorized.toExport.length > 0) {
      const toExportTransactions = transactions.filter((t) =>
        categorized.toExport.includes(t.id),
      );
      const mappedTransactions =
        this.mapTransactionsToProvider(toExportTransactions);

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

          // Create/update sync records for each transaction
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

            // Trigger attachment sync for successful transactions
            if (txResult.success && txResult.providerTransactionId) {
              const originalTx = toExportTransactions.find(
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

        // Update progress (first half for exports)
        const exportProgress = Math.round(
          ((i + batch.length) / mappedTransactions.length) * 50,
        );
        await this.updateProgress(job, exportProgress);
      }
    }

    // Step 2: Trigger attachment sync for already-synced transactions with changes
    for (const item of categorized.toSyncAttachments) {
      await triggerJob(
        "sync-accounting-attachments",
        {
          teamId,
          providerId,
          transactionId: item.transactionId,
          providerTransactionId: item.providerTransactionId,
          attachmentIds: item.newAttachmentIds,
          removedAttachments: item.removedAttachments,
          existingSyncedAttachmentMapping:
            item.syncRecord.syncedAttachmentMapping,
          syncRecordId: item.syncRecord.id,
          providerEntityType: item.syncRecord.providerEntityType ?? undefined,
        },
        "accounting",
      );
      totalAttachmentsSynced++;
    }

    // Update progress to 100%
    await this.updateProgress(job, 100);

    this.logger.info("Manual accounting export completed", {
      teamId,
      userId,
      providerId,
      totalExported,
      totalAttachmentsSynced,
      skipped: categorized.alreadyComplete.length,
      totalFailed,
    });

    return {
      teamId,
      providerId,
      exportedCount: totalExported,
      attachmentsSyncedCount: totalAttachmentsSynced,
      skippedCount: categorized.alreadyComplete.length,
      failedCount: totalFailed,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Categorize transactions based on their sync status and attachment changes
   */
  private categorizeTransactions(
    transactions: Array<{
      id: string;
      attachments: Array<{ id: string; name: string | null }>;
    }>,
    syncRecordMap: Map<string, AccountingSyncRecord>,
  ): CategorizedTransaction {
    const result: CategorizedTransaction = {
      toExport: [],
      toSyncAttachments: [],
      alreadyComplete: [],
    };

    for (const tx of transactions) {
      const syncRecord = syncRecordMap.get(tx.id);

      // No sync record or failed status = needs export
      if (!syncRecord || syncRecord.status === "failed") {
        result.toExport.push(tx.id);
        continue;
      }

      // Already synced - check for attachment changes
      const currentAttachmentIds = new Set(
        tx.attachments?.filter((a) => a.name !== null).map((a) => a.id) ?? [],
      );
      const syncedMapping = syncRecord.syncedAttachmentMapping ?? {};
      const syncedIds = new Set(Object.keys(syncedMapping));

      // Find new attachments (in current, not in synced)
      const newAttachmentIds = [...currentAttachmentIds].filter(
        (id) => !syncedIds.has(id),
      );

      // Find removed attachments (in synced, not in current)
      const removedAttachments = [...syncedIds]
        .filter((id) => !currentAttachmentIds.has(id))
        .map((middayId) => ({
          middayId,
          providerId: syncedMapping[middayId] ?? null,
        }));

      // Has attachment changes?
      if (newAttachmentIds.length > 0 || removedAttachments.length > 0) {
        if (syncRecord.providerTransactionId) {
          result.toSyncAttachments.push({
            transactionId: tx.id,
            providerTransactionId: syncRecord.providerTransactionId,
            syncRecord,
            newAttachmentIds,
            removedAttachments,
          });
        } else {
          // Has changes but no provider transaction ID - needs re-export
          result.toExport.push(tx.id);
        }
      } else {
        // No changes - skip
        result.alreadyComplete.push(tx.id);
      }
    }

    return result;
  }
}
