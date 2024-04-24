import { generateAttachment } from "@midday/inbox";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

client.defineJob({
  id: Jobs.INBOX_PROCESS,
  name: "Inbox - Process",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.INBOX_PROCESS,
    schema: z.object({
      teamId: z.string(),
      fallbackName: z.string(),
      forwardedTo: z.string().email().optional(),
      attachments: z
        .array(
          z.object({
            content: z.string(),
            contentType: z.string(),
            size: z.number(),
          })
        )
        .optional(),
    }),
  }),
  integrations: {
    supabase,
  },
  run: async (payload, io) => {
    const { teamId, fallbackName, attachments, forwardedTo } = payload;

    // Transform and upload files
    const uploadedAttachments = attachments?.map(async (attachment) => {
      const { content, contentType, size, fileName } = await generateAttachment(
        attachment
      );

      const { data } = await io.supabase.client.storage
        .from("vault")
        .upload(`${teamId}/inbox/${fileName}`, content, {
          contentType,
        });

      return {
        name: fallbackName,
        status: "processing",
        team_id: teamId,
        file_path: data?.path.split("/"),
        file_name: fileName,
        content_type: contentType,
        forwarded_to: forwardedTo,
        size,
      };
    });

    if (!uploadedAttachments?.length) {
      throw Error("No attachments");
    }

    const insertData = await Promise.all(uploadedAttachments);

    // Insert records
    const { data: inboxData } = await io.supabase.client
      .from("decrypted_inbox")
      .insert(insertData)
      .select("*, name:decrypted_name")
      .throwOnError();

    if (!inboxData?.length) {
      throw Error("No records");
    }

    await Promise.all(
      inboxData?.map((inbox) =>
        client.sendEvent({
          name: Events.INBOX_DOCUMENT,
          payload: {
            inboxId: inbox.id,
            teamId,
          },
        })
      )
    );
  },
});
