import { processTransactionAttachmentSchema } from "@jobs/schema";
import { DocumentClient } from "@midday/documents";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk";
import { convertHeic } from "../document/convert-heic";
import { processDocument } from "../document/process-document";

export const processTransactionAttachment = schemaTask({
  id: "process-transaction-attachment",
  schema: processTransactionAttachmentSchema,
  maxDuration: 60,
  queue: {
    concurrencyLimit: 100,
  },
  run: async ({ transactionId, mimetype, filePath, teamId }) => {
    const supabase = createClient();

    // If the file is a HEIC we need to convert it to a JPG
    if (mimetype === "image/heic") {
      await convertHeic.triggerAndWait({
        filePath,
      });
    }

    const filename = filePath.at(-1);

    const { data } = await supabase.storage
      .from("vault")
      .createSignedUrl(filePath.join("/"), 60);

    if (!data) {
      throw Error("File not found");
    }

    const document = new DocumentClient();

    const result = await document.getInvoiceOrReceipt({
      documentUrl: data?.signedUrl,
      mimetype,
    });

    // Update the transaction with the tax information
    if (result.tax_rate && result.tax_type) {
      await supabase
        .from("transactions")
        .update({
          tax_rate: result.tax_rate,
          tax_type: result.tax_type,
        })
        .eq("id", transactionId);
    }

    // NOTE: Process documents and images for classification
    await processDocument.trigger({
      mimetype,
      filePath,
      teamId,
    });
  },
});
