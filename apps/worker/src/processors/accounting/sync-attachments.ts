import {
  getAccountingSyncStatus,
  getTransactionAttachmentsForSync,
  updateSyncedAttachmentMapping,
} from "@midday/db/queries";
import { createClient } from "@midday/supabase/job"; // Only for storage access
import type { Job } from "bullmq";
import type { AccountingAttachmentSyncPayload } from "../../schemas/accounting";
import { AccountingProcessorBase, type AccountingProviderId } from "./base";

/** Maximum attachment size allowed for upload (10MB) */
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

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

    // Step 3: Upload new attachments
    if (newAttachmentIds.length > 0) {
      // Get attachment details from database
      const attachments = await getTransactionAttachmentsForSync(db, {
        teamId,
        attachmentIds: newAttachmentIds,
      });

      for (const attachment of attachments) {
        try {
          if (!attachment.path || !attachment.name || !attachment.type) {
            this.logger.warn("Skipping attachment with missing data", {
              attachmentId: attachment.id,
            });
            failedCount++;
            continue;
          }

          // Download file from storage
          const filePath = Array.isArray(attachment.path)
            ? attachment.path.join("/")
            : attachment.path;

          const { data: fileData, error: downloadError } =
            await supabase.storage.from("vault").download(filePath);

          if (downloadError || !fileData) {
            this.logger.error("Failed to download attachment", {
              attachmentId: attachment.id,
              path: filePath,
              error: downloadError?.message,
            });
            failedCount++;
            continue;
          }

          // Convert Blob to Buffer
          const buffer = Buffer.from(await fileData.arrayBuffer());

          // Check file size limit
          if (buffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
            this.logger.warn("Attachment exceeds size limit, skipping", {
              attachmentId: attachment.id,
              fileName: attachment.name,
              size: buffer.length,
              maxSize: MAX_ATTACHMENT_SIZE_BYTES,
            });
            failedCount++;
            continue;
          }

          // Upload to accounting provider
          const result = await provider.uploadAttachment({
            tenantId: orgId,
            transactionId: providerTransactionId,
            fileName: attachment.name,
            mimeType: attachment.type,
            content: buffer,
            entityType: providerEntityType,
          });

          if (result.success) {
            uploadedCount++;
            // Store mapping: Midday ID -> Provider ID
            currentMapping[attachment.id] = result.attachmentId ?? null;

            this.logger.info("Attachment uploaded successfully", {
              attachmentId: attachment.id,
              providerAttachmentId: result.attachmentId,
            });
          } else {
            failedCount++;
            this.logger.error("Failed to upload attachment", {
              attachmentId: attachment.id,
              error: result.error,
            });
          }
        } catch (error) {
          failedCount++;
          this.logger.error("Error uploading attachment", {
            attachmentId: attachment.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }

        // Update progress
        const processed = uploadedCount + failedCount + deletedCount;
        const total =
          newAttachmentIds.length + (removedAttachments?.length ?? 0);
        const progress = Math.round((processed / Math.max(total, 1)) * 100);
        await this.updateProgress(job, progress);
      }
    }

    // Step 4: Update sync record with new mapping
    if (uploadedCount > 0 || deletedCount > 0) {
      if (syncRecordId) {
        await updateSyncedAttachmentMapping(db, {
          syncRecordId,
          syncedAttachmentMapping: currentMapping,
        });
      } else {
        // For new syncs, find the sync record and update it
        const syncRecords = await getAccountingSyncStatus(db, {
          teamId,
          transactionIds: [transactionId],
          provider: providerId as AccountingProviderId,
        });

        if (syncRecords.length > 0 && syncRecords[0]) {
          await updateSyncedAttachmentMapping(db, {
            syncRecordId: syncRecords[0].id,
            syncedAttachmentMapping: currentMapping,
          });
        }
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
}
