import { DocumentClient } from "@midday/documents";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { convertHeic } from "../document/convert-heic";
import { processDocument } from "../document/process-document";

export const processAttachment = schemaTask({
  id: "process-attachment",
  schema: z.object({
    teamId: z.string().uuid(),
    mimetype: z.string(),
    size: z.number(),
    filePath: z.array(z.string()),
    referenceId: z.string().optional(),
    website: z.string().optional(),
  }),
  maxDuration: 60,
  queue: {
    concurrencyLimit: 100,
  },
  run: async ({ teamId, mimetype, size, filePath, referenceId, website }) => {
    const supabase = createClient();

    // If the file is a HEIC we need to convert it to a JPG
    if (mimetype === "image/heic") {
      await convertHeic.triggerAndWait({
        filePath,
      });
    }

    const filename = filePath.at(-1);

    const { data: inboxData } = await supabase
      .from("inbox")
      .insert({
        // NOTE: If we can't parse the name using OCR this will be the fallback name
        display_name: filename,
        team_id: teamId,
        file_path: filePath,
        file_name: filename,
        content_type: mimetype,
        size,
        reference_id: referenceId,
        website,
      })
      .select("*")
      .single()
      .throwOnError();

    if (!inboxData) {
      throw Error("Inbox data not found");
    }

    const { data } = await supabase.storage
      .from("vault")
      .createSignedUrl(filePath.join("/"), 60);

    if (!data) {
      throw Error("File not found");
    }

    try {
      const document = new DocumentClient();

      const result = await document.getInvoiceOrReceipt({
        documentUrl: data?.signedUrl,
        mimetype,
      });

      await supabase
        .from("inbox")
        .update({
          amount: result.amount,
          currency: result.currency,
          display_name: result.name ?? undefined,
          website: result.website ?? undefined,
          date: result.date,
          tax_amount: result.tax_amount,
          tax_rate: result.tax_rate,
          tax_type: result.tax_type,
          type: result.type as "invoice" | "expense" | null | undefined,
          status: "pending",
        })
        .eq("id", inboxData.id)
        .select()
        .single();

      // NOTE: Process documents and images for classification
      await processDocument.trigger({
        mimetype,
        filePath,
        teamId,
      });

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
