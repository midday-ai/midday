import { writeToString } from "@fast-csv/format";
import { getTransactionsForExport, updateDocument } from "@midday/db/queries";
import { createClient } from "@midday/supabase/job";
import { download } from "@midday/supabase/storage";
import { getTaxTypeLabel } from "@midday/utils/tax";
import { job } from "@worker/core/job";
import { exportsQueue } from "@worker/queues/queues";
import {
  BlobReader,
  BlobWriter,
  TextReader,
  Uint8ArrayReader,
  ZipWriter,
} from "@zip.js/zip.js";
import { format, parseISO } from "date-fns";
import xlsx from "node-xlsx";
import { z } from "zod";

const exportTransactionsSchema = z.object({
  teamId: z.string().uuid(),
  locale: z.string(),
  dateFormat: z.string().nullable().optional(),
  transactionIds: z.array(z.string().uuid()),
});

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

// Helper function to determine transaction type for folder organization
function getTransactionType(
  transaction: Awaited<ReturnType<typeof getTransactionsForExport>>[0],
): string {
  // Income transactions
  if (transaction.categorySlug === "income" || transaction.amount > 0) {
    return "income";
  }

  // Transfer transactions
  if (transaction.categorySlug === "transfer") {
    return "transfers";
  }

  // Expense transactions (negative amount, not transfer)
  if (transaction.amount < 0) {
    return "expenses";
  }

  // Fallback
  return "other";
}

// Simple attachment download with concurrency limit
async function downloadAttachments(
  supabase: ReturnType<typeof createClient>,
  transactionsData: Awaited<ReturnType<typeof getTransactionsForExport>>,
) {
  // Group attachments by transaction and include attachment count and transaction type
  const allAttachments = transactionsData.flatMap((transaction) =>
    transaction.attachments.map((attachment, idx) => ({
      transactionId: transaction.id,
      attachment,
      index: idx,
      totalAttachments: transaction.attachments.length,
      transactionType: getTransactionType(transaction),
      transaction, // Include full transaction for folder organization
    })),
  );

  // Process downloads in chunks to avoid overwhelming the API
  const CHUNK_SIZE = 10;
  const results: Array<{
    id: string;
    name: string;
    folderPath: string;
    fullPath: string;
    blob: Blob | null;
  }> = [];

  for (let i = 0; i < allAttachments.length; i += CHUNK_SIZE) {
    const chunk = allAttachments.slice(i, i + CHUNK_SIZE);

    const chunkPromises = chunk.map(
      async ({
        transactionId,
        attachment,
        index,
        totalAttachments,
        transactionType,
      }) => {
        try {
          if (!attachment.path) {
            return null;
          }

          // Generate filename
          const originalFilename =
            attachment.path.at(-1) || attachment.name || `attachment-${index}`;
          const lastDotIndex = originalFilename.lastIndexOf(".");
          let filename: string;

          if (lastDotIndex > 0) {
            const baseFilename = originalFilename.substring(0, lastDotIndex);
            let extension = originalFilename.substring(lastDotIndex + 1);

            // Convert HEIC to jpeg for compatibility
            if (
              extension.toLowerCase() === "heic" ||
              extension.toLowerCase() === "heif"
            ) {
              extension = "jpeg";
            }

            // Only add index suffix if there are multiple attachments
            const indexSuffix = totalAttachments > 1 ? `_${index}` : "";
            filename = `${baseFilename}-${transactionId.slice(-8)}${indexSuffix}.${extension}`;
          } else {
            // Only add index suffix if there are multiple attachments
            const indexSuffix = totalAttachments > 1 ? `_${index}` : "";
            filename = `${originalFilename}-${transactionId.slice(-8)}${indexSuffix}.bin`;
          }

          // Create folder path based on transaction type
          const folderPath = `attachments/${transactionType}/`;
          const fullPath = `${folderPath}${filename}`;

          const { data } = await download(supabase, {
            bucket: "vault",
            path: attachment.path.join("/"),
          });

          return {
            id: transactionId,
            name: filename,
            folderPath,
            fullPath,
            blob: data,
          };
        } catch {
          return null; // Skip failed downloads
        }
      },
    );

    const chunkResults = await Promise.all(chunkPromises);
    results.push(
      ...chunkResults.filter(
        (
          result,
        ): result is {
          id: string;
          name: string;
          folderPath: string;
          fullPath: string;
          blob: Blob | null;
        } => result !== null,
      ),
    );
  }

  return results;
}

// Transform transaction data to export format
function transformTransactionToRow(
  transaction: Awaited<ReturnType<typeof getTransactionsForExport>>[0],
  locale: string,
  dateFormat: string,
  attachments: Array<{
    id: string;
    name: string;
    folderPath: string;
    fullPath: string;
    blob: Blob | null;
  }>,
) {
  const taxRate = transaction.taxRate ?? transaction.category?.taxRate ?? 0;
  const taxAmount = Math.abs(
    +((taxRate * transaction.amount) / (100 + taxRate)).toFixed(2),
  );

  const taxTypeValue =
    transaction.taxType ?? transaction.category?.taxType ?? "";
  const formattedTaxType = getTaxTypeLabel(taxTypeValue) || "-";

  // Create locale-aware number formatter
  const numberFormatter = new Intl.NumberFormat(locale);
  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: transaction.currency,
  });

  const formattedTaxRate =
    taxRate > 0 ? `${numberFormatter.format(taxRate)}%` : "-";
  const formattedTaxAmount =
    taxAmount > 0 ? currencyFormatter.format(taxAmount) : "-";

  const transactionAttachments = attachments
    .filter((a) => a && a.id === transaction.id)
    .map((a) => a.fullPath) // Use full path to show folder structure in CSV
    .join(", ");

  return [
    transaction.id,
    format(parseISO(transaction.date), dateFormat ?? "LLL dd, y"),
    transaction.name,
    transaction.description,
    numberFormatter.format(transaction.amount), // Locale-aware number formatting
    transaction.currency,
    currencyFormatter.format(transaction.amount),
    formattedTaxType,
    formattedTaxRate,
    formattedTaxAmount,
    transaction.counterpartyName ?? "",
    transaction.category?.name ?? "",
    transaction.category?.description ?? "",
    transaction.attachments.length > 0 || transaction.status === "completed"
      ? "Completed"
      : "Not completed",
    transactionAttachments,
    transaction.balance ? numberFormatter.format(transaction.balance) : "",
    transaction.bankAccount?.name ?? "",
    transaction.note ?? "",
    transaction.tags?.map((t) => t.name).join(", ") ?? "",
  ];
}

export const exportTransactionsJob = job(
  "export-transactions",
  exportTransactionsSchema,
  {
    queue: exportsQueue,
    attempts: 3,
    priority: 1,
    removeOnComplete: 20,
  },
  async ({ teamId, locale, transactionIds, dateFormat }, ctx) => {
    const startTime = Date.now();

    const supabase = createClient();
    const baseFileName = `export-${format(new Date(), dateFormat ?? "yyyy-MM-dd")}`;
    const filePath = `${baseFileName}.zip`;
    const fullPath = `${teamId}/exports/${filePath}`;

    try {
      await ctx.job.updateProgress(20);

      // Fetch transaction data
      const transactionsData = await getTransactionsForExport(ctx.db, {
        teamId,
        transactionIds,
      });

      if (transactionsData.length === 0) {
        throw new Error("No transactions found for export");
      }

      // Download attachments
      const attachments = await downloadAttachments(supabase, transactionsData);
      await ctx.job.updateProgress(50);

      // Sort transactions by date (newest first)
      const sortedTransactions = transactionsData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      // Transform data to export format
      const rows = sortedTransactions.map((transaction) =>
        transformTransactionToRow(
          transaction,
          locale,
          dateFormat ?? "LLL dd, y",
          attachments,
        ),
      );

      // Create CSV
      const csv = await writeToString(rows, {
        headers: columns.map((c) => c.label),
      });

      // Create Excel data
      const excelData = [
        columns.map((c) => c.label), // Header row
        ...rows.map((row) => row.map((cell) => cell ?? "")),
      ];

      const buffer = xlsx.build([
        {
          name: "Transactions",
          data: excelData,
          options: {},
        },
      ]);

      // Create ZIP file with all content
      const zipFileWriter = new BlobWriter("application/zip");
      const zipWriter = new ZipWriter(zipFileWriter);

      // Add CSV and Excel files
      await zipWriter.add("transactions.csv", new TextReader(csv));
      await zipWriter.add("transactions.xlsx", new Uint8ArrayReader(buffer));

      // Add attachments to ZIP with organized folder structure
      const validAttachments = attachments.filter(
        (attachment) => attachment?.blob,
      );

      for (const attachment of validAttachments) {
        if (attachment.blob) {
          await zipWriter.add(
            attachment.fullPath,
            new BlobReader(attachment.blob),
          );
        }
      }

      const zip = await zipWriter.close();

      await ctx.job.updateProgress(80);

      // Upload ZIP to storage
      ctx.logger.info("Uploading export file to storage", { fullPath });

      const { error: uploadError } = await supabase.storage
        .from("vault")
        .upload(fullPath, await zip.arrayBuffer(), {
          upsert: true,
          contentType: "application/zip",
        });

      if (uploadError) {
        throw new Error(`Failed to upload export: ${uploadError.message}`);
      }

      // Update document record created by trigger
      const exportContent = `Transaction export with ${rows.length} transactions and ${validAttachments.length} attachments`;
      await updateDocument(ctx.db, {
        teamId,
        fileName: fullPath,
        processingStatus: "completed",
        title: `Export ${format(new Date(), dateFormat ?? "yyyy-MM-dd")}`,
        body: exportContent,
        content: exportContent,
        summary: exportContent,
      });

      await ctx.job.updateProgress(100);

      const duration = Date.now() - startTime;

      const result = {
        jobId: ctx.job.id!,
        filePath,
        fullPath,
        totalItems: rows.length,
        totalAttachments: validAttachments.length,
        duration,
      };

      ctx.logger.info("Transaction export completed successfully", {
        teamId,
        totalTransactions: transactionsData.length,
        totalAttachments: validAttachments.length,
        fullPath,
        duration,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      ctx.logger.error("Transaction export failed", {
        teamId,
        transactionCount: transactionIds.length,
        error: errorMessage,
        errorType: error?.constructor?.name,
        duration: Date.now() - startTime,
      });

      throw error;
    }
  },
);
