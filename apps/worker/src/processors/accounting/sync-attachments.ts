import {
  getAccountingProvider,
  type AccountingProviderConfig,
} from "@midday/accounting";
import {
  getAppByAppId,
  getTransactionAttachmentsForSync,
  updateAccountingSyncAttachment,
} from "@midday/db/queries";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { AccountingAttachmentSyncPayload } from "../../schemas/accounting";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Sync attachments to accounting provider processor
 * Uploads transaction attachments (receipts, invoices) to the accounting provider
 */
export class SyncAttachmentsProcessor extends BaseProcessor<AccountingAttachmentSyncPayload> {
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
    } = job.data;

    const db = getDb();
    const supabase = createClient(); // Used for file storage access

    this.logger.info("Starting attachment sync", {
      teamId,
      providerId,
      transactionId,
      providerTransactionId,
      attachmentCount: attachmentIds.length,
    });

    // Get the app configuration for this provider
    const app = await getAppByAppId(db, { appId: providerId, teamId });

    if (!app || !app.config) {
      throw new Error(`${providerId} is not connected for this team`);
    }

    const config = app.config as AccountingProviderConfig;

    // Initialize the accounting provider
    const clientId = this.getClientId(providerId);
    const clientSecret = this.getClientSecret(providerId);
    const redirectUri = this.getRedirectUri(providerId);

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(`Missing OAuth configuration for ${providerId}`);
    }

    const provider = getAccountingProvider(providerId as "xero", {
      clientId,
      clientSecret,
      redirectUri,
      config,
    });

    // Get attachment details from database using db package
    const attachments = await getTransactionAttachmentsForSync(db, {
      teamId,
      attachmentIds,
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
          tenantId: config.tenantId,
          transactionId: providerTransactionId,
          fileName: attachment.name,
          mimeType: attachment.type,
          content: buffer,
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
        ((uploadedCount + failedCount) / attachments.length) * 100
      );
      await this.updateProgress(job, progress);
    }

    // Update sync record with attachment info using db package
    if (uploadedAttachmentIds.length > 0) {
      await updateAccountingSyncAttachment(db, {
        transactionId,
        teamId,
        provider: providerId as "xero" | "quickbooks" | "fortnox" | "visma",
        providerAttachmentId: uploadedAttachmentIds.join(","),
      });
    }

    this.logger.info("Attachment sync completed", {
      teamId,
      providerId,
      transactionId,
      uploadedCount,
      failedCount,
      total: attachments.length,
    });

    return {
      teamId,
      providerId,
      transactionId,
      uploadedCount,
      failedCount,
    };
  }

  private getClientId(providerId: string): string | undefined {
    switch (providerId) {
      case "xero":
        return process.env.XERO_CLIENT_ID;
      case "quickbooks":
        return process.env.QUICKBOOKS_CLIENT_ID;
      default:
        return undefined;
    }
  }

  private getClientSecret(providerId: string): string | undefined {
    switch (providerId) {
      case "xero":
        return process.env.XERO_CLIENT_SECRET;
      case "quickbooks":
        return process.env.QUICKBOOKS_CLIENT_SECRET;
      default:
        return undefined;
    }
  }

  private getRedirectUri(providerId: string): string | undefined {
    switch (providerId) {
      case "xero":
        return process.env.XERO_OAUTH_REDIRECT_URL;
      case "quickbooks":
        return process.env.QUICKBOOKS_OAUTH_REDIRECT_URL;
      default:
        return undefined;
    }
  }
}
