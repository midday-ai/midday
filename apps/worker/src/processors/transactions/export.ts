import { PassThrough } from "node:stream";
import { writeToString } from "@fast-csv/format";
import {
  createShortLink,
  markTransactionsAsExported,
  updateDocumentByPath,
} from "@midday/db/queries";
import { createClient } from "@midday/supabase/job";
import { signedUrl } from "@midday/supabase/storage";
import { getAppUrl } from "@midday/utils/envs";
import archiver from "archiver";
import type { Job } from "bullmq";
import { format } from "date-fns";
import xlsx from "node-xlsx";
import type { ExportTransactionsPayload } from "../../schemas/transactions";
import { getDb } from "../../utils/db";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";
import { ProcessExportProcessor } from "./process-export";

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

export class ExportTransactionsProcessor extends BaseProcessor<ExportTransactionsPayload> {
  async process(job: Job<ExportTransactionsPayload>): Promise<{
    filePath: string;
    fullPath: string;
    fileName: string;
    totalItems: number;
  }> {
    const {
      teamId,
      userId,
      locale,
      transactionIds,
      dateFormat,
      exportSettings,
    } = job.data;
    const supabase = createClient();

    const filePath = `export-${format(new Date(), `${dateFormat ?? "yyyy-MM-dd"}-HHmm`)}`;
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

    await this.updateProgress(job, 20);

    // Process transactions in batches of 100
    const totalBatches = Math.ceil(transactionIds.length / BATCH_SIZE);
    const progressPerBatch = 60 / totalBatches;
    let currentProgress = 20;
    const batchResults = [];

    for (let i = 0; i < transactionIds.length; i += BATCH_SIZE) {
      const batch = transactionIds.slice(i, i + BATCH_SIZE);
      const processExportProcessor = new ProcessExportProcessor();

      const result = await processExportProcessor.processTransactions({
        ids: batch,
        teamId,
        locale,
        dateFormat,
        onProgress: async (progress: number) => {
          const batchProgress =
            currentProgress + (progress / 100) * progressPerBatch;
          await this.updateProgress(job, Math.round(batchProgress));
        },
      });

      batchResults.push(result);
      currentProgress += progressPerBatch;
      await this.updateProgress(job, Math.round(currentProgress));
    }

    // Combine and sort rows by date (newest first)
    const rows = batchResults
      .flatMap((r) => r.rows)
      .sort((a, b) => {
        const dateA = new Date(a[1] as string).getTime();
        const dateB = new Date(b[1] as string).getTime();
        return Number.isNaN(dateA) || Number.isNaN(dateB) ? 0 : dateB - dateA;
      });

    const attachments = batchResults.flatMap((r) => r.attachments);

    // Find column indices by key
    const idColumnIndex = columns.findIndex((c) => c.key === "id");
    const amountColumnIndex = columns.findIndex((c) => c.key === "amount");

    // Create a map of transaction ID -> type (expense/income) based on amount
    const transactionTypeMap = new Map<string, "expense" | "income">();
    for (const row of rows) {
      const transactionId = row[idColumnIndex] as string;
      const amount = row[amountColumnIndex] as number;
      const type = amount < 0 ? "expense" : "income";
      transactionTypeMap.set(transactionId, type);
    }

    await this.updateProgress(job, 80);

    // Prepare all files before creating zip
    const files: Array<{ name: string; data: Buffer }> = [];

    // Generate CSV if enabled
    if (settings.includeCSV) {
      const csv = await writeToString(rows, {
        headers: columns.map((c) => c.label),
        delimiter: settings.csvDelimiter,
      });
      files.push({
        name: "transactions.csv",
        data: Buffer.from(csv, "utf-8"),
      });
    }

    // Generate XLSX if enabled
    if (settings.includeXLSX) {
      const data = [
        columns.map((c) => c.label),
        ...rows.map((row) => row.map((cell) => cell ?? "")),
      ];
      const buffer = xlsx.build([{ name: "Transactions", data, options: {} }]);
      files.push({
        name: "transactions.xlsx",
        data: Buffer.from(buffer),
      });
    }

    // Convert attachments to buffers, organized by transaction type
    for (const attachment of attachments) {
      if (attachment.blob) {
        try {
          const arrayBuffer = await attachment.blob.arrayBuffer();
          const transactionType =
            transactionTypeMap.get(attachment.id) ?? "expense";
          const attachmentPath = `attachments/${transactionType}/${attachment.name}`;
          files.push({
            name: attachmentPath,
            data: Buffer.from(arrayBuffer),
          });
        } catch (error) {
          this.logger.warn("Failed to add attachment to zip", {
            error,
            attachmentName: attachment.name,
          });
        }
      }
    }

    // Create zip archive using PassThrough stream
    const zip = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = new PassThrough();

      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("error", reject);
      archive.pipe(stream);

      // Add all files synchronously
      for (const file of files) {
        archive.append(file.data, { name: file.name });
      }

      archive.finalize();
    });

    await this.updateProgress(job, 90);

    const fullPath = `${path}/${fileName}`;

    // Upload to Supabase storage with timeout
    const { error: uploadError } = await withTimeout(
      supabase.storage.from("vault").upload(fullPath, zip, {
        upsert: true,
        contentType: "application/zip",
      }),
      TIMEOUTS.FILE_UPLOAD,
      `File upload timed out after ${TIMEOUTS.FILE_UPLOAD}ms`,
    );

    if (uploadError) {
      throw new Error(`Failed to upload export file: ${uploadError.message}`);
    }

    await this.updateProgress(job, 95);

    // Update documents table (non-critical)
    const db = getDb();
    const pathTokens = fullPath.split("/");
    await updateDocumentByPath(db, {
      pathTokens,
      teamId,
      processingStatus: "completed",
    });

    // Mark transactions as exported so they disappear from review tab
    await markTransactionsAsExported(db, transactionIds);

    // Create short link if email is enabled
    if (settings.sendEmail && settings.accountantEmail) {
      const expireIn = 7 * 24 * 60 * 60;
      const { data: signedUrlData } = await signedUrl(supabase, {
        bucket: "vault",
        path: fullPath,
        expireIn,
        options: { download: true },
      });

      if (signedUrlData?.signedUrl) {
        const shortLink = await createShortLink(getDb(), {
          url: signedUrlData.signedUrl,
          teamId,
          userId,
          type: "download",
          fileName,
          mimeType: "application/zip",
          expiresAt: new Date(Date.now() + expireIn * 1000).toISOString(),
        });

        if (shortLink) {
          this.logger.debug("Short link created for export", {
            downloadLink: `${getAppUrl()}/s/${shortLink.shortId}`,
          });
        }
      }
    }

    // Ensure progress reaches 100% before returning
    await this.updateProgress(job, 100);

    return {
      filePath,
      fullPath: `${path}/${fileName}`,
      fileName,
      totalItems: rows.length,
    };
  }
}
