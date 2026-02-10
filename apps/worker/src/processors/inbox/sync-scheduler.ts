import {
  getExistingInboxAttachmentsByReferenceIds,
  getInboxAccountInfo,
  getInboxBlocklist,
  updateInboxAccount,
} from "@midday/db/queries";
import { separateBlocklistEntries } from "@midday/db/utils/blocklist";
import { InboxConnector } from "@midday/inbox/connector";
import {
  assertInboxAuthError,
  InboxSyncError,
  isInboxAuthError,
} from "@midday/inbox/errors";
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

    // Get the account info to access provider and teamId
    const accountRow = await getInboxAccountInfo(db, { id: inboxAccountId });

    if (!accountRow) {
      throw new Error("Account not found");
    }

    const connector = new InboxConnector(accountRow.provider, db);

    this.logger.info("Starting inbox sync", {
      accountId: inboxAccountId,
      teamId: accountRow.teamId,
      provider: accountRow.provider,
      lastAccessed: accountRow.lastAccessed,
    });

    try {
      const maxResults = 50;

      const attachments = await connector.getAttachments({
        id: inboxAccountId,
        teamId: accountRow.teamId,
        maxResults,
        lastAccessed: accountRow.lastAccessed,
        fullSync: manualSync,
      });

      this.logger.info("Fetched attachments from provider", {
        accountId: inboxAccountId,
        totalFound: attachments.length,
        provider: accountRow.provider,
      });

      // Filter out attachments that are already processed
      const referenceIds = attachments.map(
        (attachment) => attachment.referenceId,
      );

      this.logger.info("Checking for existing attachments by referenceIds", {
        accountId: inboxAccountId,
        referenceIds: referenceIds,
        referenceIdsCount: referenceIds.length,
      });

      const existingAttachmentsResults =
        await getExistingInboxAttachmentsByReferenceIds(db, {
          referenceIds,
          teamId: accountRow.teamId,
        });

      this.logger.info("Found existing attachments in database", {
        accountId: inboxAccountId,
        existingCount: existingAttachmentsResults.length,
        existingReferenceIds: existingAttachmentsResults.map(
          (r) => r.referenceId,
        ),
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

      // Create a Set for O(1) lookup
      const existingReferenceIdSet = new Set(
        existingAttachments.data?.map((e) => e.reference_id) ?? [],
      );

      this.logger.info("Comparing attachments with existing set", {
        accountId: inboxAccountId,
        existingSetSize: existingReferenceIdSet.size,
        sampleExisting: Array.from(existingReferenceIdSet).slice(0, 3),
        sampleAttachments: attachments.slice(0, 3).map((a) => ({
          referenceId: a.referenceId,
          filename: a.filename,
        })),
      });

      const filteredAttachments = attachments.filter((attachment) => {
        // Skip if already exists in database
        const exists = existingReferenceIdSet.has(attachment.referenceId);
        if (exists) {
          skippedAlreadyProcessed++;
          this.logger.debug("Skipping already processed attachment", {
            referenceId: attachment.referenceId,
            filename: attachment.filename,
          });
          return false;
        }

        // Skip if attachment is too large
        if (attachment.size > MAX_ATTACHMENT_SIZE) {
          skippedTooLarge++;
          this.logger.warn("Attachment exceeds size limit", {
            filename: attachment.filename,
            size: attachment.size,
            maxSize: MAX_ATTACHMENT_SIZE,
            accountId: inboxAccountId,
          });
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

      this.logger.info("Attachment filtering summary", {
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
      });

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

      this.logger.info("Attachment processing summary", {
        accountId: inboxAccountId,
        totalFetched: attachments.length,
        afterFiltering: filteredAttachments.length,
        uploaded: uploadedAttachments.length,
      });

      if (uploadedAttachments.length > 0) {
        this.logger.info("Triggering document processing", {
          accountId: inboxAccountId,
          attachmentCount: uploadedAttachments.length,
        });

        // Trigger process-attachment jobs for each uploaded attachment
        await Promise.all(
          uploadedAttachments.map((attachment) =>
            triggerJob("process-attachment", attachment, "inbox"),
          ),
        );

        // Send notification for new inbox items
        try {
          await triggerJob(
            "notification",
            {
              type: "inbox_new",
              teamId: accountRow.teamId,
              totalCount: uploadedAttachments.length,
              inboxType: "sync",
              source: "system",
              provider: accountRow.provider,
            },
            "notifications",
          );
        } catch (error) {
          // Don't fail the entire process if notification fails
          this.logger.warn("Failed to trigger inbox_new notification", {
            accountId: inboxAccountId,
            teamId: accountRow.teamId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }

        this.logger.info("New inbox items processed", {
          accountId: inboxAccountId,
          teamId: accountRow.teamId,
          totalCount: uploadedAttachments.length,
        });
      }

      // Update account with successful sync - mark as connected and clear errors
      await updateInboxAccount(db, {
        id: inboxAccountId,
        lastAccessed: new Date().toISOString(),
        status: "connected",
        errorMessage: null,
      });

      this.logger.info("Inbox sync completed", {
        accountId: inboxAccountId,
        processedAttachments: uploadedAttachments.length,
      });

      return {
        accountId: inboxAccountId,
        attachmentsProcessed: uploadedAttachments.length,
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      // Handle structured InboxAuthError
      if (isInboxAuthError(error)) {
        assertInboxAuthError(error);

        this.logger.error("Inbox sync failed - authentication error", {
          accountId: inboxAccountId,
          errorCode: error.code,
          errorMessage: error.message,
          requiresReauth: error.requiresReauth,
          provider: error.provider,
        });

        if (error.requiresReauth) {
          // Mark as disconnected - user needs to re-authenticate
          await updateInboxAccount(db, {
            id: inboxAccountId,
            status: "disconnected",
            errorMessage: `Authentication failed (${error.code}): ${error.message}`,
          });

          this.logger.error(
            "Account marked as disconnected - requires reauth",
            {
              accountId: inboxAccountId,
              errorCode: error.code,
              provider: error.provider,
            },
          );
        } else {
          // Transient auth error - don't change status, let retry handle it
          this.logger.warn("Transient auth error - will retry", {
            accountId: inboxAccountId,
            errorCode: error.code,
            provider: error.provider,
          });
        }

        throw error;
      }

      // Handle structured InboxSyncError
      if (error instanceof InboxSyncError) {
        this.logger.warn("Inbox sync failed - sync error", {
          accountId: inboxAccountId,
          errorCode: error.code,
          errorMessage: error.message,
          isRetryable: error.isRetryable(),
          provider: error.provider,
        });

        // Sync errors are typically transient - don't change connection status
        throw error;
      }

      // Handle unknown errors (fallback)
      const errorMessage =
        error instanceof Error ? error.message : "Unknown sync error";

      this.logger.error("Inbox sync failed - unknown error", {
        accountId: inboxAccountId,
        error: errorMessage,
        provider: accountRow.provider,
      });

      // For unknown errors, don't change connection status
      throw error;
    }
  }
}
