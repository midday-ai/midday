import { ACCOUNTING_ERROR_CODES, RATE_LIMITS } from "@midday/accounting";
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

/**
 * Derive error code from error message for database storage
 * This allows the frontend to show appropriate error messages
 */
function deriveErrorCodeFromMessage(
  errorMessage: string | undefined,
): string | undefined {
  if (!errorMessage) return undefined;

  const messageLower = errorMessage.toLowerCase();

  if (messageLower.includes("rate limit")) {
    return ACCOUNTING_ERROR_CODES.RATE_LIMIT;
  }
  if (
    messageLower.includes("401") ||
    messageLower.includes("unauthorized") ||
    messageLower.includes("authentication failed")
  ) {
    return ACCOUNTING_ERROR_CODES.AUTH_EXPIRED;
  }
  if (
    messageLower.includes("financial year") ||
    messageLower.includes("fiscal year") ||
    messageLower.includes("bokföringsår")
  ) {
    return ACCOUNTING_ERROR_CODES.FINANCIAL_YEAR_MISSING;
  }
  // Detect invalid account errors from various providers:
  // Xero: "Account code <number> is not valid", "Account code not found"
  // Fortnox: "konto" (Swedish for account), error code 2000106
  // QuickBooks: validation errors mentioning account
  // Also detect errors thrown by our validation
  if (
    (messageLower.includes("account") &&
      (messageLower.includes("invalid") ||
        messageLower.includes("not valid") ||
        messageLower.includes("not found"))) ||
    messageLower.includes("konto") || // Swedish: account
    messageLower.includes("2000106") // Fortnox: alphanumeric validation error
  ) {
    return ACCOUNTING_ERROR_CODES.INVALID_ACCOUNT;
  }
  if (messageLower.includes("validation") || messageLower.includes("400")) {
    return ACCOUNTING_ERROR_CODES.VALIDATION;
  }
  if (messageLower.includes("not found") || messageLower.includes("404")) {
    return ACCOUNTING_ERROR_CODES.NOT_FOUND;
  }
  if (/\b5\d{2}\b/.test(messageLower)) {
    return ACCOUNTING_ERROR_CODES.SERVER_ERROR;
  }

  return ACCOUNTING_ERROR_CODES.UNKNOWN;
}

// Process transactions in batches
const BATCH_SIZE = 50;

/**
 * Calculate delay for attachment jobs based on provider rate limits
 * Spaces jobs with extra buffer to prevent concurrent upload overlap.
 *
 * Each job may upload multiple attachments, and uploads can take time.
 * We add buffer to ensure previous job's uploads complete before next starts.
 *
 * Example for Xero (60 calls/min, 2x buffer):
 * - Job 0 at 0ms, Job 1 at 2000ms, Job 2 at 4000ms, etc.
 */
function calculateAttachmentJobDelay(
  providerId: string,
  jobIndex: number,
): number {
  const config = RATE_LIMITS[providerId as keyof typeof RATE_LIMITS];
  const callsPerMinute = config?.callsPerMinute ?? 60;

  // Base delay: 60000ms / callsPerMinute
  // Add 2x buffer to account for upload duration and prevent overlap
  const msPerJob = Math.ceil((60000 / callsPerMinute) * 2);

  return jobIndex * msPerJob;
}

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
    errors?: Array<{
      code?: string;
      message: string;
      transactionId?: string;
    }>;
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

    // Track errors for structured response
    const errors: Array<{
      code?: string;
      message: string;
      transactionId?: string;
    }> = [];

    // Progress: 0% - Starting
    await this.updateProgress(job, 2);

    // Initialize provider with valid tokens
    const { provider, config, db } = await this.initializeProvider(
      teamId,
      providerId,
    );

    // Progress: 5% - Provider initialized
    await this.updateProgress(job, 5);

    // Get target bank account (use provider-agnostic org ID)
    const orgId = this.getOrgIdFromConfig(config);
    const targetAccount = await this.getTargetAccount(provider, orgId, config);

    // Progress: 8% - Account fetched
    await this.updateProgress(job, 8);

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

    // Progress tracking
    await this.updateProgress(job, 10); // Data loaded and categorized

    let totalExported = 0;
    let totalFailed = 0;
    let totalAttachmentsSynced = 0;
    let attachmentJobIndex = 0; // Track job index for delay calculation

    // Calculate progress ranges
    const hasExports = categorized.toExport.length > 0;
    const hasAttachmentSyncs = categorized.toSyncAttachments.length > 0;

    // Progress: 10-70% for exports, 70-90% for attachment job triggers, 90-100% final
    const exportProgressStart = 10;
    const exportProgressEnd = hasExports ? 70 : 10;
    const attachmentProgressStart = exportProgressEnd;
    const attachmentProgressEnd = hasAttachmentSyncs ? 90 : exportProgressEnd;

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
            jobId: job.id ?? `fallback-${Date.now()}`,
          });

          totalExported += result.syncedCount;
          totalFailed += result.failedCount;

          // Create/update sync records for each transaction
          for (const txResult of result.results) {
            const errorCode = deriveErrorCodeFromMessage(txResult.error);

            await upsertAccountingSyncRecord(db, {
              transactionId: txResult.transactionId,
              teamId,
              provider: providerId as AccountingProviderId,
              providerTenantId: orgId,
              providerTransactionId: txResult.providerTransactionId,
              syncType: "manual",
              status: txResult.success ? "synced" : "failed",
              errorMessage: txResult.error,
              errorCode,
              providerEntityType: txResult.providerEntityType,
            });

            // Collect errors from failed transactions
            if (!txResult.success && txResult.error) {
              const errorMessage = txResult.error;

              // Add to errors array (dedupe by code or message)
              if (
                !errors.some(
                  (e) =>
                    (errorCode && e.code === errorCode) ||
                    e.message === errorMessage,
                )
              ) {
                errors.push({
                  code: errorCode,
                  message: errorMessage,
                });
              }
            }

            // Trigger attachment sync for successful transactions
            if (txResult.success && txResult.providerTransactionId) {
              const originalTx = toExportTransactions.find(
                (t) => t.id === txResult.transactionId,
              );
              const mappedTx = batch.find(
                (t) => t.id === txResult.transactionId,
              );
              const attachments =
                originalTx?.attachments?.filter((a) => a.name !== null) ?? [];

              if (attachments.length > 0) {
                const delay = calculateAttachmentJobDelay(
                  providerId,
                  attachmentJobIndex,
                );
                await triggerJob(
                  "sync-accounting-attachments",
                  {
                    teamId,
                    providerId,
                    transactionId: txResult.transactionId,
                    providerTransactionId: txResult.providerTransactionId,
                    attachmentIds: attachments.map((a) => a.id),
                    providerEntityType: txResult.providerEntityType,
                    // Tax info for history note (Xero) - only for new exports
                    taxAmount: mappedTx?.taxAmount,
                    taxRate: mappedTx?.taxRate,
                    taxType: mappedTx?.taxType,
                    note: mappedTx?.note,
                    addHistoryNote: true, // New export - add summary note after attachments
                  },
                  "accounting",
                  { delay },
                );
                attachmentJobIndex++;
              } else if (providerId === "xero" && mappedTx) {
                // For Xero transactions without attachments, still add history note directly
                try {
                  await provider.addTransactionHistoryNote?.({
                    tenantId: orgId,
                    transactionId: txResult.providerTransactionId,
                    taxAmount: mappedTx.taxAmount,
                    taxRate: mappedTx.taxRate,
                    taxType: mappedTx.taxType,
                    note: mappedTx.note,
                  });
                } catch (error) {
                  // Non-fatal - just log
                  this.logger.warn(
                    "Failed to add history note for transaction without attachments",
                    {
                      transactionId: txResult.transactionId,
                      error:
                        error instanceof Error
                          ? error.message
                          : "Unknown error",
                    },
                  );
                }
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
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          this.logger.error("Export batch failed", {
            teamId,
            providerId,
            batchIndex: Math.floor(i / BATCH_SIZE) + 1,
            error: errorMessage,
          });

          totalFailed += batch.length;

          // Parse error for structured response
          let errorCode: string | undefined;
          let userMessage = errorMessage;

          // Try to parse JSON error from AccountingOperationError
          try {
            const parsed = JSON.parse(errorMessage);
            if (parsed.code) {
              errorCode = parsed.code;
              userMessage = parsed.message || errorMessage;
            }
          } catch {
            // Not JSON, use as-is
          }

          // Add to errors array (dedupe by code)
          if (
            !errors.some(
              (e) => e.code === errorCode && e.message === userMessage,
            )
          ) {
            errors.push({
              code: errorCode,
              message: userMessage,
            });
          }

          for (const tx of batch) {
            await upsertAccountingSyncRecord(db, {
              transactionId: tx.id,
              teamId,
              provider: providerId as AccountingProviderId,
              providerTenantId: orgId,
              syncType: "manual",
              status: "failed",
              errorMessage,
            });
          }
        }

        // Update progress within export range (10-70%)
        const batchProgress = (i + batch.length) / mappedTransactions.length;
        const exportProgress = Math.round(
          exportProgressStart +
            batchProgress * (exportProgressEnd - exportProgressStart),
        );
        await this.updateProgress(job, exportProgress);
      }
    }

    // Step 2: Trigger attachment sync for already-synced transactions with changes
    if (categorized.toSyncAttachments.length > 0) {
      await this.updateProgress(job, attachmentProgressStart);

      for (const [i, item] of categorized.toSyncAttachments.entries()) {
        const delay = calculateAttachmentJobDelay(
          providerId,
          attachmentJobIndex,
        );
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
          { delay },
        );
        attachmentJobIndex++;
        totalAttachmentsSynced++;

        // Update progress within attachment range (70-90%)
        const attachmentProgress = Math.round(
          attachmentProgressStart +
            ((i + 1) / categorized.toSyncAttachments.length) *
              (attachmentProgressEnd - attachmentProgressStart),
        );
        await this.updateProgress(job, attachmentProgress);
      }
    }

    // Final progress - 100%
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
      errors: errors.length > 0 ? errors : undefined,
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

      // Has attachment changes OR status is "partial" (needs retry)?
      const needsAttachmentSync =
        newAttachmentIds.length > 0 ||
        removedAttachments.length > 0 ||
        syncRecord.status === "partial";

      if (needsAttachmentSync) {
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
