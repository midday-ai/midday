import {
  type AccountingProvider,
  type ProviderEntityType,
  RATE_LIMITS,
} from "@midday/accounting";
import {
  PROVIDER_ATTACHMENT_CONFIG,
  resolveMimeType,
  sleep,
  throttledConcurrent,
} from "@midday/accounting/utils";
import {
  getAccountingSyncStatus,
  getTransactionAttachmentsForSync,
  updateSyncedAttachmentMapping,
} from "@midday/db/queries";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { AccountingAttachmentSyncPayload } from "../../schemas/accounting";
import { AccountingProcessorBase, type AccountingProviderId } from "./base";

/**
 * Note: Job-level rate limiting is handled at creation time via delays
 * (see export-transactions.ts calculateAttachmentJobDelay)
 *
 * This processor handles uploading attachments within a single job.
 * RATE_LIMITS is still used for throttledConcurrent when a transaction
 * has multiple attachments.
 */

/** Number of retries for individual attachment uploads */
const ATTACHMENT_UPLOAD_RETRIES = 3;

/** Base delay for normal errors (ms) - increases exponentially */
const ATTACHMENT_RETRY_BASE_DELAY_MS = 2000;

/** Base delay for rate limit (429) errors (ms) - much longer */
const RATE_LIMIT_RETRY_BASE_DELAY_MS = 30000; // 30 seconds

/**
 * Sync attachments to accounting provider processor
 * Uploads transaction attachments (receipts, invoices) to the accounting provider
 *
 * Supports:
 * - Uploading new attachments
 * - Deleting/unlinking removed attachments (where supported by provider)
 * - Tracking mappings between Midday IDs and provider IDs
 */
export class SyncAttachmentsProcessor extends AccountingProcessorBase<AccountingAttachmentSyncPayload> {
  async process(job: Job<AccountingAttachmentSyncPayload>): Promise<{
    teamId: string;
    providerId: string;
    transactionId: string;
    uploadedCount: number;
    deletedCount: number;
    failedCount: number;
  }> {
    const {
      teamId,
      providerId,
      transactionId,
      providerTransactionId,
      attachmentIds,
      removedAttachments,
      existingSyncedAttachmentMapping,
      syncRecordId,
      providerEntityType,
      // Tax info for history note (Xero only)
      taxAmount,
      taxRate,
      taxType,
      note,
      addHistoryNote,
    } = job.data;

    const supabase = createClient(); // Only for storage access (unavoidable)

    this.logger.info("Starting attachment sync", {
      teamId,
      providerId,
      transactionId,
      providerTransactionId,
      newAttachmentCount: attachmentIds.length,
      removedAttachmentCount: removedAttachments?.length ?? 0,
    });

    // Initialize provider with valid tokens
    const { provider, config, db } = await this.initializeProvider(
      teamId,
      providerId,
    );

    // Get provider-agnostic org ID
    const orgId = this.getOrgIdFromConfig(config);

    // Start with existing mapping or empty object
    const currentMapping: Record<string, string | null> =
      existingSyncedAttachmentMapping
        ? { ...existingSyncedAttachmentMapping }
        : {};

    let uploadedCount = 0;
    let deletedCount = 0;
    let failedCount = 0;

    // Step 1: Delete removed attachments (if supported by provider)
    if (removedAttachments && removedAttachments.length > 0) {
      for (const removed of removedAttachments) {
        // Only attempt deletion if we have a provider ID
        if (removed.providerId) {
          try {
            const deleteResult = await provider.deleteAttachment({
              tenantId: orgId,
              transactionId: providerTransactionId,
              attachmentId: removed.providerId,
            });

            if (deleteResult.success) {
              deletedCount++;
              this.logger.info("Attachment deleted from provider", {
                middayId: removed.middayId,
                providerId: removed.providerId,
              });
            } else {
              // Log warning but don't fail - some providers don't support deletion
              this.logger.warn("Failed to delete attachment from provider", {
                middayId: removed.middayId,
                providerId: removed.providerId,
                error: deleteResult.error,
              });
            }
          } catch (error) {
            this.logger.warn("Error deleting attachment from provider", {
              middayId: removed.middayId,
              providerId: removed.providerId,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        // Remove from mapping regardless of API success
        // (the file is gone from Midday, so we shouldn't track it)
        delete currentMapping[removed.middayId];
      }
    }

    // Step 2: Filter out attachments that are already synced
    const alreadySyncedIds = new Set(Object.keys(currentMapping));
    const newAttachmentIds = attachmentIds.filter(
      (id) => !alreadySyncedIds.has(id),
    );

    if (
      newAttachmentIds.length === 0 &&
      (!removedAttachments || removedAttachments.length === 0)
    ) {
      this.logger.info("No attachment changes to sync", {
        teamId,
        transactionId,
      });
      return {
        teamId,
        providerId,
        transactionId,
        uploadedCount: 0,
        deletedCount: 0,
        failedCount: 0,
      };
    }

    // Track error codes and messages from failed uploads
    const errorCodes: string[] = [];
    const errorMessages: string[] = [];

    // Step 3: Upload new attachments concurrently with rate limiting
    if (newAttachmentIds.length > 0) {
      // Get attachment details from database
      const attachments = await getTransactionAttachmentsForSync(db, {
        teamId,
        attachmentIds: newAttachmentIds,
      });

      // Get rate limits for this provider
      const rateLimit =
        RATE_LIMITS[providerId as keyof typeof RATE_LIMITS] ?? RATE_LIMITS.xero;

      this.logger.info("Starting concurrent attachment uploads", {
        attachmentCount: attachments.length,
        maxConcurrent: rateLimit.maxConcurrent,
        callDelayMs: rateLimit.callDelayMs,
      });

      // Bind method references to preserve 'this' context in callbacks
      const uploadAttachment = this.uploadSingleAttachment.bind(this);
      const updateProgress = this.updateProgress.bind(this);

      // Upload attachments concurrently
      const uploadResults = await throttledConcurrent(
        attachments,
        async (attachment) => {
          return uploadAttachment(
            attachment,
            supabase,
            provider,
            orgId,
            providerTransactionId,
            providerId as keyof typeof PROVIDER_ATTACHMENT_CONFIG,
            providerEntityType,
          );
        },
        rateLimit.maxConcurrent,
        rateLimit.callDelayMs,
        async (completed, total) => {
          // Update progress (50-100% for uploads, assuming 0-50% was deletions)
          const deletionProgress = removedAttachments?.length ?? 0;
          const totalOps = total + deletionProgress;
          const progress = Math.round(
            ((deletionProgress + completed) / Math.max(totalOps, 1)) * 100,
          );
          await updateProgress(job, progress);
        },
      );

      // Process results and collect error codes

      for (const result of uploadResults.results) {
        if (result.success) {
          uploadedCount++;
          currentMapping[result.attachmentId] = result.providerAttachmentId;
        } else {
          failedCount++;
          if (result.errorCode) {
            errorCodes.push(result.errorCode);
          }
          if (result.error) {
            errorMessages.push(result.error);
          }
        }
      }

      // Count errors from throttledConcurrent
      failedCount += uploadResults.errors.length;

      // Log any errors
      for (const error of uploadResults.errors) {
        this.logger.error("Attachment upload failed", {
          index: error.index,
          error: error.error.message,
        });
      }
    }

    // Step 4: Update sync record with new mapping and status
    const hasChanges = uploadedCount > 0 || deletedCount > 0 || failedCount > 0;
    if (hasChanges) {
      // Determine status: 'partial' if any failures, 'synced' if all succeeded
      const status = failedCount > 0 ? "partial" : "synced";

      // Use the first error code and message for the sync record
      // (most attachment failures have the same root cause)
      // Use null to clear values on successful retry
      const errorCode = failedCount > 0 ? (errorCodes[0] ?? null) : null;
      const errorMessage =
        failedCount > 0
          ? (errorMessages[0] ??
            `${failedCount} attachment(s) failed to upload`)
          : null;

      const updateParams = {
        syncedAttachmentMapping: currentMapping,
        status: status as "synced" | "partial",
        errorMessage,
        errorCode,
      };

      let recordIdToUpdate = syncRecordId;

      if (!recordIdToUpdate) {
        // For new syncs, find the sync record and update it
        const syncRecords = await getAccountingSyncStatus(db, {
          teamId,
          transactionIds: [transactionId],
          provider: providerId as AccountingProviderId,
        });

        if (syncRecords.length > 0 && syncRecords[0]) {
          recordIdToUpdate = syncRecords[0].id;
        }
      }

      if (recordIdToUpdate) {
        await updateSyncedAttachmentMapping(db, {
          syncRecordId: recordIdToUpdate,
          ...updateParams,
        });

        this.logger.info("Sync record status updated", {
          syncRecordId: recordIdToUpdate,
          transactionId,
          status,
          uploadedCount,
          deletedCount,
          failedCount,
          errorMessage: errorMessage ?? undefined,
        });
      } else {
        this.logger.error("Could not find sync record to update status", {
          transactionId,
          teamId,
          providerId,
          status,
          failedCount,
        });
      }
    }

    // Step 4: Add history note after all attachments (Xero only, new exports only)
    if (addHistoryNote && providerId === "xero") {
      try {
        await provider.addTransactionHistoryNote?.({
          tenantId: orgId,
          transactionId: providerTransactionId,
          taxAmount,
          taxRate,
          taxType,
          note,
        });
        this.logger.debug("Added history note to Xero transaction", {
          transactionId: providerTransactionId,
        });
      } catch (error) {
        // Non-fatal - just log warning
        this.logger.warn("Failed to add history note to Xero transaction", {
          transactionId: providerTransactionId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    this.logger.info("Attachment sync completed", {
      teamId,
      providerId,
      transactionId,
      uploadedCount,
      deletedCount,
      failedCount,
      totalMappings: Object.keys(currentMapping).length,
    });

    return {
      teamId,
      providerId,
      transactionId,
      uploadedCount,
      deletedCount,
      failedCount,
    };
  }

  /**
   * Upload a single attachment with retries
   * Note: Rate limiting is handled at job creation time via delays
   */
  private async uploadSingleAttachment(
    attachment: {
      id: string;
      name: string | null;
      path: string[] | null;
      type: string | null;
    },
    supabase: ReturnType<typeof createClient>,
    provider: AccountingProvider,
    orgId: string,
    providerTransactionId: string,
    providerId: keyof typeof PROVIDER_ATTACHMENT_CONFIG,
    providerEntityType?: ProviderEntityType,
  ): Promise<{
    success: boolean;
    attachmentId: string;
    providerAttachmentId: string | null;
    error?: string;
    errorCode?: string;
  }> {
    // Validate attachment data
    if (!attachment.path || !attachment.name) {
      this.logger.warn("Skipping attachment with missing data", {
        attachmentId: attachment.id,
      });
      return {
        success: false,
        attachmentId: attachment.id,
        providerAttachmentId: null,
        error: "Missing attachment data",
      };
    }

    // Download file from storage
    const filePath = Array.isArray(attachment.path)
      ? attachment.path.join("/")
      : attachment.path;

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("vault")
      .download(filePath);

    if (downloadError || !fileData) {
      this.logger.error("Failed to download attachment", {
        attachmentId: attachment.id,
        path: filePath,
        error: downloadError?.message,
      });
      return {
        success: false,
        attachmentId: attachment.id,
        providerAttachmentId: null,
        error: `Download failed: ${downloadError?.message}`,
      };
    }

    // Convert Blob to Buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Resolve and validate MIME type using layered approach
    const providerConfig = PROVIDER_ATTACHMENT_CONFIG[providerId];
    const mimeResolution = resolveMimeType(
      attachment.type,
      attachment.name,
      buffer,
      providerId,
    );

    if (!mimeResolution.mimeType) {
      this.logger.warn("Could not determine valid MIME type for attachment", {
        attachmentId: attachment.id,
        storedType: attachment.type,
        fileName: attachment.name,
        error: mimeResolution.error,
      });
      return {
        success: false,
        attachmentId: attachment.id,
        providerAttachmentId: null,
        error: mimeResolution.error ?? "Unsupported file type",
        errorCode: "ATTACHMENT_UNSUPPORTED_TYPE",
      };
    }

    // Log if MIME type was resolved from fallback
    if (mimeResolution.source !== "stored") {
      this.logger.info("Resolved MIME type from fallback", {
        attachmentId: attachment.id,
        storedType: attachment.type,
        resolvedType: mimeResolution.mimeType,
        source: mimeResolution.source,
      });
    }

    const resolvedMimeType = mimeResolution.mimeType;

    // Check file size limit (provider-specific)
    if (buffer.length > providerConfig.maxSizeBytes) {
      const maxSizeMB = Math.round(providerConfig.maxSizeBytes / 1024 / 1024);
      this.logger.warn("Attachment exceeds size limit, skipping", {
        attachmentId: attachment.id,
        fileName: attachment.name,
        size: buffer.length,
        maxSize: providerConfig.maxSizeBytes,
        provider: providerId,
      });
      return {
        success: false,
        attachmentId: attachment.id,
        providerAttachmentId: null,
        error: `File too large for ${providerId} (max: ${maxSizeMB}MB)`,
        errorCode: "ATTACHMENT_TOO_LARGE",
      };
    }

    // Upload with retries (rate limiting handled via job delays)
    let lastError: string | undefined;
    let isRateLimited = false;

    for (let attempt = 0; attempt <= ATTACHMENT_UPLOAD_RETRIES; attempt++) {
      if (attempt > 0) {
        // Use longer delay for rate limit errors (429)
        const baseDelay = isRateLimited
          ? RATE_LIMIT_RETRY_BASE_DELAY_MS
          : ATTACHMENT_RETRY_BASE_DELAY_MS;
        const delay = baseDelay * 2 ** (attempt - 1);

        this.logger.warn("Retrying attachment upload", {
          attachmentId: attachment.id,
          attempt: attempt + 1,
          maxAttempts: ATTACHMENT_UPLOAD_RETRIES + 1,
          delayMs: delay,
          isRateLimited,
          previousError: lastError,
        });
        await sleep(delay);
      }

      try {
        const result = await provider.uploadAttachment({
          tenantId: orgId,
          transactionId: providerTransactionId,
          fileName: attachment.name,
          mimeType: resolvedMimeType,
          content: buffer,
          entityType: providerEntityType,
        });

        if (result.success) {
          this.logger.info("Attachment uploaded successfully", {
            attachmentId: attachment.id,
            providerAttachmentId: result.attachmentId,
            attempt: attempt + 1,
          });
          return {
            success: true,
            attachmentId: attachment.id,
            providerAttachmentId: result.attachmentId ?? null,
          };
        }

        lastError = result.error;
        // Check if this is a rate limit error
        isRateLimited = this.isRateLimitError(lastError);
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error";
        isRateLimited = this.isRateLimitError(lastError);
      }
    }

    // All retries exhausted
    this.logger.error("Failed to upload attachment after retries", {
      attachmentId: attachment.id,
      attempts: ATTACHMENT_UPLOAD_RETRIES + 1,
      error: lastError,
    });

    return {
      success: false,
      attachmentId: attachment.id,
      providerAttachmentId: null,
      error: lastError,
      errorCode: "ATTACHMENT_UPLOAD_FAILED",
    };
  }

  /**
   * Check if an error message indicates a rate limit (429) error
   */
  private isRateLimitError(error: string | undefined): boolean {
    if (!error) return false;
    const lowerError = error.toLowerCase();
    return (
      lowerError.includes("429") ||
      lowerError.includes("rate limit") ||
      lowerError.includes("too many requests") ||
      lowerError.includes("throttl")
    );
  }
}
