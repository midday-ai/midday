import { updateTransaction } from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { job } from "@worker/core/job";
import { documentsQueue } from "@worker/queues/queues";
import { processAttachmentSchema } from "@worker/schemas/jobs";
import { convertHeicJob } from "./convert-heic";
import { processDocumentJob } from "./process-document";

export const processAttachmentJob = job(
  "process-attachment",
  processAttachmentSchema,
  {
    queue: documentsQueue,
    attempts: 3,
    priority: 2,
    removeOnComplete: 100,
  },
  async ({ transactionId, mimetype, filePath, teamId }, ctx) => {
    ctx.logger.info("Processing transaction attachment", {
      transactionId,
      mimetype,
      filePath: filePath.join("/"),
      teamId,
    });

    try {
      // If the file is a HEIC we need to convert it to a JPG
      if (mimetype === "image/heic") {
        ctx.logger.info("Converting HEIC file", {
          transactionId,
          filePath: filePath.join("/"),
        });

        await convertHeicJob.trigger({
          filePath,
        });
      }

      // Create signed URL for document processing
      const { data } = await ctx.supabase.storage
        .from("vault")
        .createSignedUrl(filePath.join("/"), 60);

      if (!data) {
        throw new Error("File not found");
      }

      ctx.logger.info("Processing document for invoice/receipt data", {
        transactionId,
        documentUrl: data.signedUrl,
      });

      const document = new DocumentClient();

      const result = await document.getInvoiceOrReceipt({
        documentUrl: data.signedUrl,
        mimetype,
      });

      // Update the transaction with the tax information
      if (result.tax_rate && result.tax_type) {
        ctx.logger.info("Updating transaction with tax information", {
          transactionId,
          taxRate: result.tax_rate,
          taxType: result.tax_type,
        });

        await updateTransaction(ctx.db, {
          id: transactionId,
          teamId,
          taxRate: result.tax_rate,
          taxType: result.tax_type,
        });
      }

      // Process documents and images for classification
      ctx.logger.info("Triggering document processing for classification", {
        transactionId,
        filePath: filePath.join("/"),
      });

      await processDocumentJob.trigger({
        mimetype,
        filePath,
        teamId,
      });

      ctx.logger.info("Transaction attachment processing completed", {
        transactionId,
        hasTaxInfo: !!(result.tax_rate && result.tax_type),
      });

      return {
        transactionId,
        result: {
          tax_rate: result.tax_rate,
          tax_type: result.tax_type,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      ctx.logger.error("Transaction attachment processing failed", {
        transactionId,
        teamId,
        filePath: filePath.join("/"),
        error: errorMessage,
        errorType: error?.constructor?.name,
      });

      throw error;
    }
  },
);
