import { writeToString } from "@fast-csv/format";
import { getDb } from "@jobs/init";
import { exportTransactionsSchema } from "@jobs/schema";
import { serializableToBlob } from "@jobs/utils/blob";
import { createShortLink } from "@midday/db/queries";
import { createClient } from "@midday/supabase/job";
import { signedUrl } from "@midday/supabase/storage";
import { getAppUrl } from "@midday/utils/envs";
import { metadata, schemaTask, tasks } from "@trigger.dev/sdk";
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
  { label: "Tax reporting code", key: "taxReportingCode" },
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
  run: async ({
    teamId,
    userId,
    locale,
    transactionIds,
    dateFormat,
    exportSettings,
  }) => {
    const supabase = createClient();

    const filePath = `export-${format(new Date(), dateFormat ?? "yyyy-MM-dd")}`;
    const path = `${teamId}/exports`;
    const fileName = `${filePath}.zip`;

    // Use export settings with defaults
    const settings = {
      csvDelimiter: exportSettings?.csvDelimiter ?? ",",
      includeCSV: exportSettings?.includeCSV ?? true,
      includeXLSX: exportSettings?.includeXLSX ?? true,
      sendEmail: exportSettings?.sendEmail ?? false,
      accountantEmail: exportSettings?.accountantEmail,
    };

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

    const zipFileWriter = new BlobWriter("application/zip");
    const zipWriter = new ZipWriter(zipFileWriter);

    // Add CSV if enabled
    if (settings.includeCSV) {
      const csv = await writeToString(rows, {
        headers: columns.map((c) => c.label),
        delimiter: settings.csvDelimiter,
      });
      zipWriter.add("transactions.csv", new TextReader(csv));
    }

    // Add XLSX if enabled
    if (settings.includeXLSX) {
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

      zipWriter.add("transactions.xlsx", new Uint8ArrayReader(buffer));
    }

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

    // If email is enabled, create a short link for the export
    let downloadLink: string | undefined;
    if (settings.sendEmail && settings.accountantEmail) {
      const db = getDb();

      // Create a signed URL valid for 7 days
      const expireIn = 7 * 24 * 60 * 60; // 7 days in seconds
      const { data: signedUrlData } = await signedUrl(supabase, {
        bucket: "vault",
        path: fullPath,
        expireIn,
        options: {
          download: true,
        },
      });

      if (signedUrlData?.signedUrl) {
        // Create a short link for the signed URL
        const shortLink = await createShortLink(db, {
          url: signedUrlData.signedUrl,
          teamId,
          userId,
          type: "download",
          fileName,
          mimeType: "application/zip",
          expiresAt: new Date(Date.now() + expireIn * 1000).toISOString(),
        });

        if (shortLink) {
          downloadLink = `${getAppUrl()}/s/${shortLink.shortId}`;
        }
      }
    }

    // Create activity for completed export
    await tasks.trigger("notification", {
      type: "transactions_exported",
      teamId,
      transactionCount: transactionIds.length,
      locale: locale,
      dateFormat: dateFormat || "yyyy-MM-dd",
      downloadLink,
      accountantEmail: settings.accountantEmail,
      sendEmail: settings.sendEmail,
    });

    return {
      filePath,
      fullPath: `${path}/${fileName}`,
      fileName,
      totalItems: rows.length,
    };
  },
});
