import { InboxConnector } from "@midday/inbox/connector";
import { createClient } from "@midday/supabase/job";
import { getExistingInboxAttachmentsQuery } from "@midday/supabase/queries";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { processBatch } from "jobs/utils/process-batch";
import { z } from "zod";
import { processAttachment } from "../process-attachment";

const MAX_ATTACHMENTS = 10;

export const syncInboxAccount = schemaTask({
  id: "sync-inbox-account",
  schema: z.object({
    id: z.string(),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 10,
  },
  run: async (payload) => {
    const { id } = payload;

    const supabase = createClient();

    if (!id) {
      throw new Error("id is required");
    }

    const { data } = await supabase
      .from("inbox_accounts")
      .select("id, provider, team_id")
      .eq("id", id)
      .single();

    if (!data) {
      throw new Error("Account not found");
    }

    const connector = new InboxConnector(data.provider);

    const attachments = await connector.getAttachments({
      id,
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
            .upload(`${data.team_id}/inbox/${item.filename}`, item.data, {
              contentType: item.mimeType,
              upsert: true,
            });

          if (uploadData) {
            results.push({
              payload: {
                file_path: uploadData.path.split("/"),
                size: item.size,
                mimetype: item.mimeType,
                website: item.website,
                referenceId: item.referenceId,
                teamId: data.team_id,
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
  },
});
