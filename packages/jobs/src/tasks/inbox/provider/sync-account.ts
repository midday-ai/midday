import { getDb } from "@jobs/init";
import { processBatch } from "@jobs/utils/process-batch";
import {
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
import { createClient } from "@midday/supabase/job";
import { getExistingInboxAttachmentsQuery } from "@midday/supabase/queries";
import { ensureFileExtension } from "@midday/utils";
import { logger, schemaTask, tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { processAttachment } from "../process-attachment";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const BATCH_SIZE = 5;

export const syncInboxAccount = schemaTask({
  id: "sync-inbox-account",
  schema: z.object({
    id: z.string(),
    manualSync: z.boolean().optional(),
  }),
  maxDuration: 120,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 60000,
    factor: 2,
    randomize: true,
  },
  queue: {
    concurrencyLimit: 10,
  },
  machine: {
    preset: "medium-1x",
  },
  run: async (payload) => {
    const { id, manualSync = false } = payload;

    const supabase = createClient();

    if (!id) {
      throw new Error("id is required");
    }

    // Get the account info to access provider and teamId
    const accountRow = await getInboxAccountInfo(getDb(), { id });

    if (!accountRow) {
      // TODO: Unregister inbox account scheduler by deduplication key?
      throw new Error("Account not found");
    }

    const connector = new InboxConnector(accountRow.provider, getDb());

    logger.info("Starting inbox sync", {
      accountId: id,
      teamId: accountRow.teamId,
      provider: accountRow.provider,
      lastAccessed: accountRow.lastAccessed,
      manualSync,
      fullSync: manualSync,
      maxResults: 50,
    });

    try {
      // Use same limit for both initial and ongoing sync to ensure consistent behavior
      const maxResults = 50; // Same limit for both initial and ongoing sync

      const attachments = await connector.getAttachments({
        id,
        teamId: accountRow.teamId,
        maxResults,
        lastAccessed: accountRow.lastAccessed,
        fullSync: manualSync,
      });

      logger.info("Fetched attachments from provider", {
        accountId: id,
        totalFound: attachments.length,
        provider: accountRow.provider,
      });

      // Filter out attachments that are already processed
      const existingAttachments = await getExistingInboxAttachmentsQuery(
        supabase,
        attachments.map((attachment) => attachment.referenceId),
      );

      // Get blocklist entries for the team
      const blocklistEntries = await getInboxBlocklist(getDb(), {
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
          logger.info("Skipping attachment - already processed", {
            filename: attachment.filename,
            referenceId: attachment.referenceId,
            accountId: id,
          });
          return false;
        }

        // Skip if attachment is too large
        if (attachment.size > MAX_ATTACHMENT_SIZE) {
          skippedTooLarge++;
          logger.warn("Attachment exceeds size limit", {
            filename: attachment.filename,
            size: attachment.size,
            maxSize: MAX_ATTACHMENT_SIZE,
            accountId: id,
          });
          return false;
        }

        // Skip if domain is blocked
        if (attachment.website) {
          const domain = attachment.website.toLowerCase();
          if (blockedDomains.includes(domain)) {
            skippedBlockedDomain++;
            logger.info("Skipping attachment - domain blocked", {
              filename: attachment.filename,
              website: attachment.website,
              blockedDomain: domain,
              accountId: id,
            });

            return false;
          }
        }

        // Skip if sender email is blocked
        if (attachment.senderEmail) {
          const email = attachment.senderEmail.toLowerCase();
          if (blockedEmails.includes(email)) {
            skippedBlockedEmail++;
            logger.info("Skipping attachment - sender email blocked", {
              filename: attachment.filename,
              senderEmail: attachment.senderEmail,
              blockedEmail: email,
              accountId: id,
            });

            return false;
          }
        }

        return true;
      });

      logger.info("Attachment filtering summary", {
        accountId: id,
        totalFound: attachments.length,
        afterFiltering: filteredAttachments.length,
        skipped: attachments.length - filteredAttachments.length,
        skippedByReason: {
          alreadyProcessed: skippedAlreadyProcessed,
          tooLarge: skippedTooLarge,
          blockedDomain: skippedBlockedDomain,
          blockedEmail: skippedBlockedEmail,
        },
        blocklistStats: {
          blockedDomainsCount: blockedDomains.length,
          blockedEmailsCount: blockedEmails.length,
          totalBlocklistEntries: blocklistEntries.length,
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
                payload: {
                  filePath: uploadData.path.split("/"),
                  size: item.size,
                  mimetype: item.mimeType,
                  website: item.website,
                  senderEmail: item.senderEmail,
                  referenceId: item.referenceId,
                  teamId: accountRow.teamId,
                  inboxAccountId: id,
                },
              });
            }
          }

          return results;
        },
      );

      logger.info("Attachment processing summary", {
        accountId: id,
        totalFetched: attachments.length,
        afterFiltering: filteredAttachments.length,
        uploaded: uploadedAttachments.length,
        skipped: attachments.length - filteredAttachments.length,
      });

      if (uploadedAttachments.length > 0) {
        logger.info("Triggering document processing", {
          accountId: id,
          attachmentCount: uploadedAttachments.length,
        });

        await processAttachment.batchTriggerAndWait(uploadedAttachments);

        // Send notification for new inbox items
        await tasks.trigger("notification", {
          type: "inbox_new",
          teamId: accountRow.teamId,
          totalCount: uploadedAttachments.length,
          inboxType: "sync",
          provider: accountRow.provider,
        });
      }

      // Update account with successful sync - mark as connected and clear errors
      await updateInboxAccount(getDb(), {
        id,
        lastAccessed: new Date().toISOString(),
        status: "connected",
        errorMessage: null,
      });

      logger.info("Inbox sync completed", {
        accountId: id,
        processedAttachments: uploadedAttachments.length,
      });

      // Return the attachment count for the frontend
      return {
        accountId: id,
        attachmentsProcessed: uploadedAttachments.length,
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      // Handle structured InboxAuthError
      if (isInboxAuthError(error)) {
        // Use assertion to narrow type without casting
        assertInboxAuthError(error);

        logger.error("Inbox sync failed - authentication error", {
          accountId: id,
          errorCode: error.code,
          errorMessage: error.message,
          requiresReauth: error.requiresReauth,
          provider: error.provider,
        });

        if (error.requiresReauth) {
          // Mark as disconnected - user needs to re-authenticate
          await updateInboxAccount(getDb(), {
            id,
            status: "disconnected",
            errorMessage: `Authentication failed (${error.code}): ${error.message}`,
          });

          logger.error("Account marked as disconnected - requires reauth", {
            accountId: id,
            errorCode: error.code,
            provider: error.provider,
          });
        } else {
          // Transient auth error - don't change status, let retry handle it
          logger.warn("Transient auth error - will retry", {
            accountId: id,
            errorCode: error.code,
            provider: error.provider,
          });
        }

        throw error;
      }

      // Handle structured InboxSyncError
      if (error instanceof InboxSyncError) {
        logger.warn("Inbox sync failed - sync error", {
          accountId: id,
          errorCode: error.code,
          errorMessage: error.message,
          isRetryable: error.isRetryable(),
          provider: error.provider,
        });

        // Sync errors are typically transient - don't change connection status
        // Let the job retry mechanism handle it
        throw error;
      }

      // Handle unknown errors (fallback)
      const errorMessage =
        error instanceof Error ? error.message : "Unknown sync error";

      logger.error("Inbox sync failed - unknown error", {
        accountId: id,
        error: errorMessage,
        provider: accountRow.provider,
      });

      // For unknown errors, don't change connection status
      // These might be infrastructure issues that resolve on retry
      throw error;
    }
  },
});
