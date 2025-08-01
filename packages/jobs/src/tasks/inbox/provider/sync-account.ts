import { getDb } from "@jobs/init";
import { processBatch } from "@jobs/utils/process-batch";
import { getInboxAccountInfo, updateInboxAccount } from "@midday/db/queries";
import { InboxConnector } from "@midday/inbox/connector";
import { createClient } from "@midday/supabase/job";
import { getExistingInboxAttachmentsQuery } from "@midday/supabase/queries";
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { processAttachment } from "../process-attachment";

const MAX_ATTACHMENTS = 10;

export const syncInboxAccount = schemaTask({
  id: "sync-inbox-account",
  schema: z.object({
    id: z.string(),
  }),
  maxDuration: 60,
  queue: {
    concurrencyLimit: 10,
  },
  machine: {
    preset: "medium-1x",
  },
  run: async (payload) => {
    const { id } = payload;

    const db = getDb();
    const supabase = createClient();

    if (!id) {
      throw new Error("id is required");
    }

    // Get the account info to access provider and teamId
    const accountRow = await getInboxAccountInfo(db, { id });

    if (!accountRow) {
      throw new Error("Account not found");
    }

    const connector = new InboxConnector(accountRow.provider, db);

    const attachments = await connector.getAttachments({
      id,
      teamId: accountRow.teamId,
      maxResults: MAX_ATTACHMENTS,
    });

    // Filter out attachments that are already saved in the database
    const existingAttachments = await getExistingInboxAttachmentsQuery(
      supabase,
      attachments.map((attachment) => attachment.referenceId),
    );

    const filteredAttachments = attachments.filter(
      (attachment) =>
        !existingAttachments.data?.some(
          (existing) => existing.reference_id === attachment.referenceId,
        ),
    );

    const uploadedAttachments = await processBatch(
      filteredAttachments,
      5,
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

    if (uploadedAttachments.length > 0) {
      await processAttachment.batchTriggerAndWait(uploadedAttachments);
    }

    await updateInboxAccount(db, {
      id,
      lastAccessed: new Date().toISOString(),
    });
  },
});
