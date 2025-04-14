import { DocumentClient } from "@midday/documents";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { handleInboxNotifications } from "jobs/utils/inbox-notifications";
import { z } from "zod";

export const inboxDocument = schemaTask({
  id: "inbox-document",
  schema: z.object({
    inboxId: z.string().uuid(),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ inboxId }) => {
    const supabase = createClient();

    const { data: inboxData } = await supabase
      .from("inbox")
      .select()
      .eq("id", inboxId)
      .single()
      .throwOnError();

    if (!inboxData || !inboxData.file_path) {
      throw Error("Inbox data not found");
    }

    const { data } = await supabase.storage
      .from("vault")
      .download(inboxData.file_path.join("/"));

    // Convert the document data to a Buffer and base64 encode it.
    const buffer = await data?.arrayBuffer();

    if (!buffer) {
      throw Error("No file data");
    }

    try {
      const document = new DocumentClient();

      const result = await document.getInvoiceOrReceipt({
        content: Buffer.from(buffer).toString("base64"),
        documentType:
          inboxData.content_type === "application/pdf" ? "invoice" : "receipt",
      });

      const { data: updatedInbox } = await supabase
        .from("inbox")
        .update({
          amount: result.amount,
          currency: result.currency,
          display_name: result.name,
          website: result.website,
          date: result.date && new Date(result.date).toISOString(),
          type: result.type,
          description: result.description,
          status: "pending",
        })
        .eq("id", inboxId)
        .select()
        .single();

      if (updatedInbox?.amount) {
        // TODO: Send event to match inbox
      }
    } catch {
      // If we end up here we could not parse the document
      // But we want to update the status so we show the record with fallback name (Subject/From name)
      await supabase
        .from("inbox")
        .update({ status: "pending" })
        .eq("id", inboxId);

      // And send a notification about the new inbox record
      // We send this if we dont find a suggested match
      await handleInboxNotifications({
        inboxId,
        description: inboxData.display_name!,
        teamId: inboxData.team_id!,
      });
    }
  },
});
