import {
  getAccountingSyncStatus,
  getTransactionAttachmentsForSync,
  updateSyncedAttachmentIds,
} from "@midday/db/queries";
import { createClient } from "@midday/supabase/job"; // Only for storage access
import type { Job } from "bullmq";
import type { AccountingAttachmentSyncPayload } from "../../schemas/accounting";
import { AccountingProcessorBase, type AccountingProviderId } from "./base";

/**
 * Sync attachments to accounting provider processor
 * Uploads transaction attachments (receipts, invoices) to the accounting provider
 */
export class SyncAttachmentsProcessor extends AccountingProcessorBase<AccountingAttachmentSyncPayload> {
  async process(job: Job<AccountingAttachmentSyncPayload>): Promise<{
    teamId: string;
    providerId: string;
    transactionId: string;
    uploadedCount: number;
    failedCount: number;
  }> {
    const {
      teamId,
      providerId,
      transactionId,
      providerTransactionId,
      attachmentIds,
      existingSyncedAttachmentIds,
      syncRecordId,
      providerEntityType,
    } = job.data;

    const supabase = createClient(); // Only for storage access (unavoidable)

    this.logger.info("Starting attachment sync", {
      teamId,
      providerId,
      transactionId,
      providerTransactionId,
      attachmentCount: attachmentIds.length,
    });

    // Initialize provider with valid tokens
    const { provider, config, db } = await this.initializeProvider(
      teamId,
      providerId,
    );

    // Get provider-agnostic org ID
    const orgId = this.getOrgIdFromConfig(config);

    // Filter out attachments that have already been synced (duplicate check)
    const alreadySyncedSet = new Set(existingSyncedAttachmentIds ?? []);
    const newAttachmentIds = attachmentIds.filter(
      (id) => !alreadySyncedSet.has(id),
    );

    if (newAttachmentIds.length === 0) {
      this.logger.info("All attachments already synced, skipping", {
        teamId,
        transactionId,
        attachmentIds,
      });
      return {
        teamId,
        providerId,
        transactionId,
        uploadedCount: 0,
        failedCount: 0,
      };
    }

    // Get attachment details from database using db package
    const attachments = await getTransactionAttachmentsForSync(db, {
      teamId,
      attachmentIds: newAttachmentIds,
    });

    if (attachments.length === 0) {
      this.logger.info("No attachments found to sync", {
        teamId,
        transactionId,
        attachmentIds,
      });
      return {
        teamId,
        providerId,
        transactionId,
        uploadedCount: 0,
        failedCount: 0,
      };
    }

    let uploadedCount = 0;
    let failedCount = 0;
    const uploadedAttachmentIds: string[] = [];

    // Upload each attachment
    for (const attachment of attachments) {
      try {
        if (!attachment.path || !attachment.name || !attachment.type) {
          this.logger.warn("Skipping attachment with missing data", {
            attachmentId: attachment.id,
          });
          failedCount++;
          continue;
        }

        // Download file from storage using Supabase storage
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
          failedCount++;
          continue;
        }

        // Convert Blob to Buffer
        const buffer = Buffer.from(await fileData.arrayBuffer());

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
          uploadedAttachmentIds.push(attachment.id);

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
      const progress = Math.round(
        ((uploadedCount + failedCount) / attachments.length) * 100,
      );
      await this.updateProgress(job, progress);
    }

    // Update sync record with attachment info using db package
    if (uploadedAttachmentIds.length > 0) {
      // Combine existing synced IDs with newly uploaded ones
      const allSyncedIds = [
        ...(existingSyncedAttachmentIds ?? []),
        ...uploadedAttachmentIds,
      ];

      // If we have a sync record ID (update flow), use it directly
      if (syncRecordId) {
        await updateSyncedAttachmentIds(db, {
          syncRecordId,
          syncedAttachmentIds: allSyncedIds,
        });
      } else {
        // For new syncs, find the sync record and update it
        const syncRecords = await getAccountingSyncStatus(db, {
          teamId,
          transactionIds: [transactionId],
          provider: providerId as AccountingProviderId,
        });

        if (syncRecords.length > 0 && syncRecords[0]) {
          await updateSyncedAttachmentIds(db, {
            syncRecordId: syncRecords[0].id,
            syncedAttachmentIds: allSyncedIds,
          });
        }
      }
    }

    this.logger.info("Attachment sync completed", {
      teamId,
      providerId,
      transactionId,
      uploadedCount,
      failedCount,
      total: attachments.length,
      totalSyncedAttachments:
        (existingSyncedAttachmentIds?.length ?? 0) +
        uploadedAttachmentIds.length,
    });

    return {
      teamId,
      providerId,
      transactionId,
      uploadedCount,
      failedCount,
    };
  }
}
