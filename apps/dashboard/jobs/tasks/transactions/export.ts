import { writeToString } from "@fast-csv/format";
import { createClient } from "@midday/supabase/job";
import { metadata, schemaTask } from "@trigger.dev/sdk/v3";
import { BlobReader, BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import { serializableToBlob } from "jobs/utils/blob";
import { revalidateCache } from "jobs/utils/revalidate-cache";
import { z } from "zod";
import { processTransactions } from "./process";

// Process transactions in batches of 100
const BATCH_SIZE = 100;

export const exportTransactions = schemaTask({
  id: "export-transactions",
  schema: z.object({
    teamId: z.string().uuid(),
    locale: z.string(),
    transactionIds: z.array(z.string().uuid()),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 10,
  },
  machine: {
    preset: "medium-1x",
  },
  run: async ({ teamId, locale, transactionIds }) => {
    const supabase = createClient();

    const filePath = `export-${new Date().toISOString()}`;
    const path = `${teamId}/exports`;
    const fileName = `${filePath}.zip`;

    metadata.set("progress", 20);

    // Process transactions in batches of 100 and collect results
    // Update progress for each batch
    const results = [];

    const totalBatches = Math.ceil(transactionIds.length / BATCH_SIZE);
    const progressPerBatch = 60 / totalBatches;
    let currentProgress = 20;

    for (let i = 0; i < transactionIds.length; i += BATCH_SIZE) {
      const transactionBatch = transactionIds.slice(i, i + BATCH_SIZE);

      const batchResult = await processTransactions.triggerAndWait({
        ids: transactionBatch,
        locale,
      });

      results.push(batchResult);

      currentProgress += progressPerBatch;
      metadata.set("progress", Math.round(currentProgress));
    }

    const rows = results
      .flatMap((r) => (r.ok ? r.output.rows : []))
      //   Date is the first column
      .sort(
        (a, b) =>
          new Date(b[0] as string).getTime() -
          new Date(a[0] as string).getTime(),
      );

    const attachments = results.flatMap((r) =>
      r.ok ? r.output.attachments : [],
    );

    const csv = await writeToString(rows, {
      headers: [
        "Date",
        "Description",
        "Additional info",
        "Amount",
        "Currency",
        "Formatted amount",
        "VAT",
        "Category",
        "Category description",
        "Status",
        "Attachments",
        "Balance",
        "Account",
        "Note",
      ],
    });

    const zipFileWriter = new BlobWriter("application/zip");
    const zipWriter = new ZipWriter(zipFileWriter);

    zipWriter.add("transactions.csv", new TextReader(csv));

    metadata.set("progress", 90);

    // Add attachments to zip
    attachments?.map((attachment) => {
      if (attachment.blob) {
        zipWriter.add(
          attachment.name,
          new BlobReader(serializableToBlob(attachment.blob)),
        );
      }
    });

    const zip = await zipWriter.close();

    metadata.set("progress", 95);

    await supabase.storage
      .from("vault")
      .upload(`${path}/${fileName}`, await zip.arrayBuffer(), {
        upsert: true,
        contentType: "application/zip",
      });

    revalidateCache({ tag: "vault", id: teamId });

    metadata.set("progress", 100);

    return {
      filePath,
      fileName,
      totalItems: rows.length,
    };
  },
});
