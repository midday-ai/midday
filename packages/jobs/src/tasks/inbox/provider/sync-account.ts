import { getDb } from "@jobs/init";
import { processBatch } from "@jobs/utils/process-batch";
import { getInboxAccountInfo, updateInboxAccount } from "@midday/db/queries";
import { InboxConnector } from "@midday/inbox/connector";
import { createClient } from "@midday/supabase/job";
import { getExistingInboxAttachmentsQuery } from "@midday/supabase/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { processAttachment } from "../process-attachment";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const BATCH_SIZE = 5;

export const syncInboxAccount = schemaTask({
  id: "sync-inbox-account",
  schema: z.object({
    id: z.string(),
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
    const { id } = payload;

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
      isInitialSync: !accountRow.lastAccessed,
      maxResults: !accountRow.lastAccessed ? 10 : 50,
    });

    // Use different limits for initial vs ongoing sync
    const isInitialSync = !accountRow.lastAccessed;
    const maxResults = isInitialSync ? 10 : 50; // Light initial, higher for daily sync

    const attachments = await connector.getAttachments({
      id,
      teamId: accountRow.teamId,
      maxResults,
      lastAccessed: accountRow.lastAccessed,
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

    const filteredAttachments = attachments.filter((attachment) => {
      // Skip if already exists in database
      if (
        existingAttachments.data?.some(
          (existing) => existing.reference_id === attachment.referenceId,
        )
      ) {
        logger.info("Skipping attachment - already processed", {
          filename: attachment.filename,
          referenceId: attachment.referenceId,
          accountId: id,
        });
        return false;
      }

      // Skip if attachment is too large
      if (attachment.size > MAX_ATTACHMENT_SIZE) {
        logger.warn("Attachment exceeds size limit", {
          filename: attachment.filename,
          size: attachment.size,
          maxSize: MAX_ATTACHMENT_SIZE,
          accountId: id,
        });
        return false;
      }

      return true;
    });

    logger.info("Attachment filtering summary", {
      accountId: id,
      totalFound: attachments.length,
      afterFiltering: filteredAttachments.length,
      skipped: attachments.length - filteredAttachments.length,
    });

    const uploadedAttachments = await processBatch(
      filteredAttachments,
      BATCH_SIZE,
      async (batch) => {
        const results = [];
        for (const item of batch) {
          const { data: uploadData } = await supabase.storage
            .from("vault")
            .upload(`${accountRow.teamId}/inbox/${item.filename}`, item.data, {
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
    }

    await updateInboxAccount(getDb(), {
      id,
      lastAccessed: new Date().toISOString(),
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
  },
});
