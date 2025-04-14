// import { DocumentClient } from "@midday/documents";
import { DocumentClient } from "@midday/documents";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const processAttachment = schemaTask({
  id: "process-attachment",
  schema: z.object({
    teamId: z.string().uuid(),
    mimetype: z.string(),
    size: z.number(),
    file_path: z.array(z.string()),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 100,
  },
  run: async ({ teamId, mimetype, size, file_path }) => {
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
      .createSignedUrl(file_path.join("/"), 60);

    console.log(data);

    if (!data) {
      throw Error("File not found");
    }

    try {
      const document = new DocumentClient();

      const result = await document.getInvoiceOrReceipt({
        documentUrl: data?.signedUrl,
        documentType: mimetype === "application/pdf" ? "invoice" : "receipt",
      });

      console.log(result);

      //     const { data: updatedInbox } = await supabase
      //       .from("inbox")
      //       .update({
      //         amount: result.amount,
      //         currency: result.currency,
      //         display_name: result.name,
      //         website: result.website,
      //         date: result.date && new Date(result.date).toISOString(),
      //         type: result.type,
      //         description: result.description,
      //         status: "pending",
      //       })
      //       .eq("id", inboxData.id)
      //       .select()
      //       .single();

      //     // TODO: Send event to match inbox
    } catch {
      //     // If we end up here we could not parse the document
      //     // But we want to update the status so we show the record with fallback name
      //     await supabase
      //       .from("inbox")
      //       .update({ status: "pending" })
      //       .eq("id", inboxData.id);
    }
  },
});
