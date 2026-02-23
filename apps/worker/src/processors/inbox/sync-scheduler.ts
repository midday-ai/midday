import {
  createInbox,
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
const UPLOAD_CONCURRENCY = 10;

/**
 * Syncs attachments from a connected inbox account (Gmail/Outlook).
 * Triggered by manual sync or the centralized sync-accounts-scheduler.
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
      const syncStartDate = job.data.syncStartDate
        ? new Date(job.data.syncStartDate)
        : undefined;

      const attachments = await connector.getAttachments({
        id: inboxAccountId,
        teamId: accountRow.teamId,
        lastAccessed: accountRow.lastAccessed,
        fullSync: manualSync,
        syncStartDate,
        maxResults: job.data.maxResults,
      });

      this.logger.info("Fetched attachments from provider", {
        accountId: inboxAccountId,
        totalFound: attachments.length,
        provider: accountRow.provider,
      });

      await job.updateProgress({
        discoveredCount: attachments.length,
        status: "discovering",
      });

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

      const blocklistEntries = await getInboxBlocklist(db, {
        teamId: accountRow.teamId,
      });

      const { blockedDomains, blockedEmails } =
        separateBlocklistEntries(blocklistEntries);

      let skippedAlreadyProcessed = 0;
      let skippedTooLarge = 0;
      let skippedBlockedDomain = 0;
      let skippedBlockedEmail = 0;

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
        const exists = existingReferenceIdSet.has(attachment.referenceId);
        if (exists) {
          skippedAlreadyProcessed++;
          this.logger.debug("Skipping already processed attachment", {
            referenceId: attachment.referenceId,
            filename: attachment.filename,
          });
          return false;
        }

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

        if (attachment.website) {
          const domain = attachment.website.toLowerCase();
          if (blockedDomains.includes(domain)) {
            skippedBlockedDomain++;
            return false;
          }
        }

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

      // Release file buffers on skipped attachments to free memory before uploads
      for (const att of attachments) {
        if (!filteredAttachments.includes(att)) {
          (att as { data: Buffer | null }).data = null;
        }
      }

      const BATCH_THRESHOLD = 20;

      const uploadedAttachments = await processBatch(
        filteredAttachments,
        UPLOAD_CONCURRENCY,
        async (batch) => {
          const settled = await Promise.allSettled(
            batch.map(async (item) => {
              const safeFilename = ensureFileExtension(
                item.filename,
                item.mimeType,
              );

              const { data: uploadData } = await supabase.storage
                .from("vault")
                .upload(
                  `${accountRow.teamId}/inbox/${safeFilename}`,
                  item.data,
                  { contentType: item.mimeType, upsert: true },
                );

              // Release the file buffer so GC can reclaim memory
              (item as { data: Buffer | null }).data = null;

              if (!uploadData) return null;

              const filePath = uploadData.path.split("/");

              const inboxItem = await createInbox(db, {
                displayName: item.filename,
                teamId: accountRow.teamId,
                filePath,
                fileName: safeFilename,
                contentType: item.mimeType,
                size: item.size,
                referenceId: item.referenceId,
                website: item.website,
                senderEmail: item.senderEmail,
                inboxAccountId: inboxAccountId,
                status: "new",
              });

              if (!inboxItem?.id) {
                this.logger.warn(
                  "Failed to create inbox item, skipping attachment",
                  {
                    referenceId: item.referenceId,
                    filename: item.filename,
                    accountId: inboxAccountId,
                  },
                );
                return null;
              }

              return {
                filePath,
                size: item.size,
                mimetype: item.mimeType,
                website: item.website,
                senderEmail: item.senderEmail,
                referenceId: item.referenceId,
                teamId: accountRow.teamId,
                inboxAccountId: inboxAccountId,
                inboxItemId: inboxItem.id,
              };
            }),
          );

          const results = [];
          for (const result of settled) {
            if (result.status === "fulfilled" && result.value) {
              results.push(result.value);
            } else if (result.status === "rejected") {
              this.logger.warn("Upload failed for attachment in batch", {
                accountId: inboxAccountId,
                error:
                  result.reason instanceof Error
                    ? result.reason.message
                    : "Unknown error",
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

      await job.updateProgress({
        discoveredCount: attachments.length,
        uploadedCount: uploadedAttachments.length,
        status: "extracting",
      });

      if (uploadedAttachments.length > 0) {
        const useBatchExtraction =
          !manualSync ||
          !!syncStartDate ||
          uploadedAttachments.length > BATCH_THRESHOLD;

        if (useBatchExtraction) {
          const reason = !manualSync
            ? "background_sync"
            : syncStartDate
              ? "user_initiated"
              : "above_threshold";

          this.logger.info("Routing to batch extraction path", {
            accountId: inboxAccountId,
            attachmentCount: uploadedAttachments.length,
            reason,
          });

          await triggerJob(
            "batch-extract-inbox",
            {
              items: uploadedAttachments.map((a) => ({
                id: a.inboxItemId,
                filePath: a.filePath,
                teamId: a.teamId,
                mimetype: a.mimetype,
                size: a.size,
              })),
              teamId: accountRow.teamId,
              inboxAccountId: inboxAccountId,
            },
            "inbox-provider",
          );
        } else {
          this.logger.info("Routing to real-time extraction path", {
            accountId: inboxAccountId,
            attachmentCount: uploadedAttachments.length,
          });

          await Promise.all(
            uploadedAttachments.map((attachment) =>
              triggerJob("process-attachment", attachment, "inbox"),
            ),
          );
        }

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
          extractionPath: useBatchExtraction ? "batch" : "realtime",
        });
      }

      await updateInboxAccount(db, {
        id: inboxAccountId,
        lastAccessed: new Date().toISOString(),
        status: "connected",
        errorMessage: null,
      });

      await job.updateProgress({
        discoveredCount: attachments.length,
        uploadedCount: uploadedAttachments.length,
        status: "complete",
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
          this.logger.warn("Transient auth error - will retry", {
            accountId: inboxAccountId,
            errorCode: error.code,
            provider: error.provider,
          });
        }

        throw error;
      }

      if (error instanceof InboxSyncError) {
        this.logger.warn("Inbox sync failed - sync error", {
          accountId: inboxAccountId,
          errorCode: error.code,
          errorMessage: error.message,
          isRetryable: error.isRetryable(),
          provider: error.provider,
        });

        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown sync error";

      this.logger.error("Inbox sync failed - unknown error", {
        accountId: inboxAccountId,
        error: errorMessage,
        provider: accountRow.provider,
      });

      throw error;
    }
  }
}
