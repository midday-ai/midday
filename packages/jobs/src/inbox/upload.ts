import { DocumentClient } from "@midday/documents";
import { client, db, supabase } from "../client";
import { Events, Jobs } from "../constants";

const concurrencyLimit = client.defineConcurrencyLimit({
  id: "inbox-upload",
  limit: 25,
});

client.defineJob({
  id: Jobs.INBOX_UPLOAD,
  name: "Inbox - Upload",
  version: "0.0.1",
  concurrencyLimit,
  trigger: db.onInserted({
    schema: "storage",
    table: "objects",
    filter: {
      record: {
        bucket_id: ["vault"],
        path_tokens: [
          {
            // NOTE: This ensures jobs run only for files uploaded through the inbox bulk upload.
            $includes: "uploaded",
          },
        ],
      },
    },
  }),
  integrations: {
    supabase,
  },
  run: async (payload, io, ctx) => {
    const { path_tokens, metadata } = payload.record;
    const teamId = path_tokens.at(0);
    const filename = path_tokens.at(-1);

    const { data: inboxData } = await io.supabase.client
      .from("inbox")
      .upsert({
        // NOTE: If we can't parse the name using OCR this will be the fallback name
        display_name: filename,
        team_id: teamId,
        file_path: path_tokens,
        file_name: filename,
        content_type: metadata.mimetype,
        reference_id: `${ctx.source?.id}_${filename}`,
        size: metadata.size,
      })
      .select("*")
      .single()
      .throwOnError();

    const { data } = await io.supabase.client.storage
      .from("vault")
      .download(path_tokens.join("/"));

    // Convert the document data to a Buffer and base64 encode it.
    const buffer = await data?.arrayBuffer();

    if (!buffer) {
      throw Error("No file data");
    }

    try {
      const document = new DocumentClient({
        contentType: inboxData?.content_type,
      });

      const result = await document.getDocument({
        content: Buffer.from(buffer).toString("base64"),
      });

      const { data: updatedInbox } = await io.supabase.client
        .from("inbox")
        .update({
          amount: result.amount,
          currency: result.currency,
          display_name: result.name,
          website: result.website,
          due_date: result.date && new Date(result.date),
          status: "pending",
          meta: result.meta,
        })
        .eq("id", inboxData.id)
        .select()
        .single();

      if (updatedInbox?.amount) {
        await io.sendEvent("Match Inbox", {
          name: Events.INBOX_MATCH,
          payload: {
            teamId: updatedInbox.team_id,
            inboxId: updatedInbox.id,
            amount: updatedInbox.amount,
          },
        });
      }
    } catch {
      // If we end up here we could not parse the document
      // But we want to update the status so we show the record with fallback name
      await io.supabase.client
        .from("inbox")
        .update({ status: "pending" })
        .eq("id", inboxData.id);
    }
  },
});
