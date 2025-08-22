import { writeToString } from "@fast-csv/format";
import { exportTransactionsSchema } from "@jobs/schema";
import { serializableToBlob } from "@jobs/utils/blob";
import { createClient } from "@midday/supabase/job";
import { metadata, schemaTask } from "@trigger.dev/sdk";
import {
  BlobReader,
  BlobWriter,
  TextReader,
  Uint8ArrayReader,
  ZipWriter,
} from "@zip.js/zip.js";
import { format } from "date-fns";
import xlsx from "node-xlsx";
import { processExport } from "./process-export";

const columns = [
  { label: "ID", key: "id" },
  { label: "Date", key: "date" },
  { label: "Description", key: "description" },
  { label: "Additional info", key: "additionalInfo" },
  { label: "Amount", key: "amount" },
  { label: "Currency", key: "currency" },
  { label: "Formatted amount", key: "formattedAmount" },
  { label: "Tax type", key: "taxType" },
  { label: "Tax rate", key: "taxRate" },
  { label: "Tax amount", key: "taxAmount" },
  { label: "From / To", key: "counterpartyName" },
  { label: "Category", key: "category" },
  { label: "Category description", key: "categoryDescription" },
  { label: "Status", key: "status" },
  { label: "Attachments", key: "attachments" },
  { label: "Balance", key: "balance" },
  { label: "Account", key: "account" },
  { label: "Note", key: "note" },
  { label: "Tags", key: "tags" },
];

// Process transactions in batches of 100
const BATCH_SIZE = 100;

export const exportTransactions = schemaTask({
  id: "export-transactions",
  schema: exportTransactionsSchema,
  maxDuration: 300,
  queue: {
    concurrencyLimit: 10,
  },
  machine: {
    preset: "large-1x",
  },
  run: async ({ teamId, locale, transactionIds, dateFormat }) => {
    const supabase = createClient();

    const filePath = `export-${format(new Date(), dateFormat ?? "yyyy-MM-dd")}`;
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

      const batchResult = await processExport.triggerAndWait({
        ids: transactionBatch,
        locale,
        dateFormat,
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
      headers: columns.map((c) => c.label),
    });

    const data = [
      columns.map((c) => c.label), // Header row
      ...rows.map((row) => row.map((cell) => cell ?? "")),
    ];

    const buffer = xlsx.build([
      {
        name: "Transactions",
        data,
        options: {},
      },
    ]);

    const zipFileWriter = new BlobWriter("application/zip");
    const zipWriter = new ZipWriter(zipFileWriter);

    zipWriter.add("transactions.csv", new TextReader(csv));
    zipWriter.add("transactions.xlsx", new Uint8ArrayReader(buffer));

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

    const fullPath = `${path}/${fileName}`;

    await supabase.storage
      .from("vault")
      .upload(fullPath, await zip.arrayBuffer(), {
        upsert: true,
        contentType: "application/zip",
      });

    metadata.set("progress", 100);

    // Update the documents to completed (it's a zip file)
    await supabase
      .from("documents")
      .update({
        processing_status: "completed",
      })
      .eq("name", fullPath);

    return {
      filePath,
      fullPath: `${path}/${fileName}`,
      fileName,
      totalItems: rows.length,
    };
  },
});
