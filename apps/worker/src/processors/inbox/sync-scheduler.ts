import {
  getExistingInboxAttachmentsByReferenceIds,
  getInboxAccountInfo,
  getInboxBlocklist,
  updateInboxAccount,
} from "@midday/db/queries";
import { separateBlocklistEntries } from "@midday/db/utils/blocklist";
import { InboxConnector } from "@midday/inbox/connector";
import { isAuthenticationError } from "@midday/inbox/utils";
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import { ensureFileExtension } from "@midday/utils";
import type { Job } from "bullmq";
import type { InboxProviderSyncAccountPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { processBatch } from "../../utils/process-batch";
import { BaseProcessor } from "../base";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const BATCH_SIZE = 5;

/**
 * Sync scheduler processor - triggered by dynamic scheduler for each inbox account
 * Receives inbox account ID and syncs attachments from the provider
 */
export class SyncSchedulerProcessor extends BaseProcessor<InboxProviderSyncAccountPayload> {
  async process(job: Job<InboxProviderSyncAccountPayload>): Promise<{
    accountId: string;
    attachmentsProcessed: number;
    syncedAt: string;
  }> {
    const { id: inboxAccountId, manualSync = false } = job.data;
    const supabase = createClient();
    const db = getDb();

    if (!inboxAccountId) {
      throw new Error("inboxAccountId is required");
    }

    await this.updateProgress(job, 5);

    // Get the account info to access provider and teamId
    const accountRow = await getInboxAccountInfo(db, { id: inboxAccountId });

    if (!accountRow) {
      throw new Error("Account not found");
    }

    const connector = new InboxConnector(accountRow.provider, db);

    this.logger.info(
      {
        accountId: inboxAccountId,
        teamId: accountRow.teamId,
        provider: accountRow.provider,
        lastAccessed: accountRow.lastAccessed,
      },
      "Starting inbox sync",
    );

    await this.updateProgress(job, 10);

    try {
      const maxResults = 50;

      const attachments = await connector.getAttachments({
        id: inboxAccountId,
        teamId: accountRow.teamId,
        maxResults,
        lastAccessed: accountRow.lastAccessed,
        fullSync: manualSync,
      });

      this.logger.info(
        {
          accountId: inboxAccountId,
          totalFound: attachments.length,
          provider: accountRow.provider,
        },
        "Fetched attachments from provider",
      );

      await this.updateProgress(job, 20);

      // Filter out attachments that are already processed
      const existingAttachmentsResults =
        await getExistingInboxAttachmentsByReferenceIds(db, {
          referenceIds: attachments.map((attachment) => attachment.referenceId),
          teamId: accountRow.teamId,
        });

      const existingAttachments = {
        data: existingAttachmentsResults.map((r) => ({
          reference_id: r.referenceId,
        })),
      };

      // Get blocklist entries for the team
      const blocklistEntries = await getInboxBlocklist(db, {
        teamId: accountRow.teamId,
      });

      const { blockedDomains, blockedEmails } =
        separateBlocklistEntries(blocklistEntries);

      // Track filtering statistics
      let skippedAlreadyProcessed = 0;
      let skippedTooLarge = 0;
      let skippedBlockedDomain = 0;
      let skippedBlockedEmail = 0;

      const filteredAttachments = attachments.filter((attachment) => {
        // Skip if already exists in database
        if (
          existingAttachments.data?.some(
            (existing) => existing.reference_id === attachment.referenceId,
          )
        ) {
          skippedAlreadyProcessed++;
          return false;
        }

        // Skip if attachment is too large
        if (attachment.size > MAX_ATTACHMENT_SIZE) {
          skippedTooLarge++;
          this.logger.warn(
            {
              filename: attachment.filename,
              size: attachment.size,
              maxSize: MAX_ATTACHMENT_SIZE,
              accountId: inboxAccountId,
            },
            "Attachment exceeds size limit",
          );
          return false;
        }

        // Skip if domain is blocked
        if (attachment.website) {
          const domain = attachment.website.toLowerCase();
          if (blockedDomains.includes(domain)) {
            skippedBlockedDomain++;
            return false;
          }
        }

        // Skip if sender email is blocked
        if (attachment.senderEmail) {
          const email = attachment.senderEmail.toLowerCase();
          if (blockedEmails.includes(email)) {
            skippedBlockedEmail++;
            return false;
          }
        }

        return true;
      });

      this.logger.info(
        {
          accountId: inboxAccountId,
          totalFound: attachments.length,
          afterFiltering: filteredAttachments.length,
          skipped: attachments.length - filteredAttachments.length,
          skippedByReason: {
            alreadyProcessed: skippedAlreadyProcessed,
            tooLarge: skippedTooLarge,
            blockedDomain: skippedBlockedDomain,
            blockedEmail: skippedBlockedEmail,
          },
        },
        "Attachment filtering summary",
      );

      await this.updateProgress(job, 40);

      const uploadedAttachments = await processBatch(
        filteredAttachments,
        BATCH_SIZE,
        async (batch) => {
          const results = [];
          for (const item of batch) {
            // Ensure filename has proper extension as final safety check
            const safeFilename = ensureFileExtension(
              item.filename,
              item.mimeType,
            );

            const { data: uploadData } = await supabase.storage
              .from("vault")
              .upload(`${accountRow.teamId}/inbox/${safeFilename}`, item.data, {
                contentType: item.mimeType,
                upsert: true,
              });

            if (uploadData) {
              results.push({
                filePath: uploadData.path.split("/"),
                size: item.size,
                mimetype: item.mimeType,
                website: item.website,
                senderEmail: item.senderEmail,
                referenceId: item.referenceId,
                teamId: accountRow.teamId,
                inboxAccountId: inboxAccountId,
              });
            }
          }

          return results;
        },
      );

      await this.updateProgress(job, 60);

      this.logger.info(
        {
          accountId: inboxAccountId,
          totalFetched: attachments.length,
          afterFiltering: filteredAttachments.length,
          uploaded: uploadedAttachments.length,
        },
        "Attachment processing summary",
      );

      if (uploadedAttachments.length > 0) {
        this.logger.info(
          {
            accountId: inboxAccountId,
            attachmentCount: uploadedAttachments.length,
          },
          "Triggering document processing",
        );

        // Trigger process-attachment jobs for each uploaded attachment
        await Promise.all(
          uploadedAttachments.map((attachment) =>
            triggerJob("process-attachment", attachment, "inbox"),
          ),
        );

        await this.updateProgress(job, 80);

        // Trigger notification (via Trigger.dev for now)
        // TODO: Port notification system to BullMQ
        this.logger.info(
          {
            accountId: inboxAccountId,
            teamId: accountRow.teamId,
            totalCount: uploadedAttachments.length,
          },
          "New inbox items processed",
        );
      }

      // Update account with successful sync - mark as connected and clear errors
      await updateInboxAccount(db, {
        id: inboxAccountId,
        lastAccessed: new Date().toISOString(),
        status: "connected",
        errorMessage: null,
      });

      await this.updateProgress(job, 100);

      this.logger.info(
        {
          accountId: inboxAccountId,
          processedAttachments: uploadedAttachments.length,
        },
        "Inbox sync completed",
      );

      return {
        accountId: inboxAccountId,
        attachmentsProcessed: uploadedAttachments.length,
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown sync error";

      this.logger.error(
        {
          accountId: inboxAccountId,
          error: errorMessage,
          provider: accountRow.provider,
        },
        "Inbox sync failed",
      );

      // Check if this is an authentication/authorization error
      const isAuthError = isAuthenticationError(errorMessage);

      if (isAuthError) {
        // Only mark as disconnected for authentication errors
        await updateInboxAccount(db, {
          id: inboxAccountId,
          status: "disconnected",
          errorMessage: `Authentication failed: ${errorMessage}`,
        });

        this.logger.error(
          {
            accountId: inboxAccountId,
            error: errorMessage,
            provider: accountRow.provider,
          },
          "Account marked as disconnected due to auth error",
        );
      } else {
        // For temporary errors (network, API downtime, etc.), don't change connection status
        this.logger.warn(
          {
            accountId: inboxAccountId,
            error: errorMessage,
            provider: accountRow.provider,
            errorType: "temporary",
          },
          "Temporary sync error - connection status unchanged",
        );
      }

      // Re-throw the error so the job is marked as failed
      throw error;
    }
  }
}
