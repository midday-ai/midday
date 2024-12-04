import { DocumentClient } from "@midday/documents";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const inboxUpload = schemaTask({
  id: "inbox-upload",
  schema: z.object({
    id: z.string(),
    teamId: z.string().uuid(),
    mimetype: z.string(),
    size: z.number(),
    file_path: z.array(z.string()),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 25,
  },
  run: async ({ id, teamId, mimetype, size, file_path }) => {
    const supabase = createClient();

    const filename = file_path.at(-1);

    const { data: inboxData } = await supabase
      .from("inbox")
      .insert({
        // NOTE: If we can't parse the name using OCR this will be the fallback name
        display_name: filename,
        team_id: teamId,
        file_path: file_path,
        file_name: filename,
        content_type: mimetype,
        reference_id: `${id}_${filename}`,
        size,
      })
      .select("*")
      .single()
      .throwOnError();

    if (!inboxData) {
      throw Error("Inbox data not found");
    }

    const { data } = await supabase.storage
      .from("vault")
      .download(file_path.join("/"));

    // Convert the document data to a Buffer and base64 encode it.
    const buffer = await data?.arrayBuffer();

    if (!buffer) {
      throw Error("No file data");
    }

    try {
      const document = new DocumentClient({
        contentType: inboxData.content_type!,
      });

      const result = await document.getDocument({
        content: Buffer.from(buffer).toString("base64"),
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
        .eq("id", inboxData.id)
        .select()
        .single();

      // TODO: Send event to match inbox
    } catch {
      // If we end up here we could not parse the document
      // But we want to update the status so we show the record with fallback name
      await supabase
        .from("inbox")
        .update({ status: "pending" })
        .eq("id", inboxData.id);
    }
  },
});
