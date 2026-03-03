import { updateTransaction } from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { ProcessTransactionAttachmentPayload } from "../../schemas/transactions";
import { classifyFromExtraction } from "../../utils/classify-from-extraction";
import { getDb } from "../../utils/db";
import { NonRetryableError } from "../../utils/error-classification";
import {
  convertHeicToJpeg,
  MAX_HEIC_FILE_SIZE,
} from "../../utils/image-processing";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

/**
 * Process transaction attachments (receipts/invoices)
 * Extracts tax information and updates the transaction
 */
export class ProcessTransactionAttachmentProcessor extends BaseProcessor<ProcessTransactionAttachmentPayload> {
  async process(job: Job<ProcessTransactionAttachmentPayload>): Promise<void> {
    const { transactionId, mimetype, filePath, teamId } = job.data;
    const supabase = createClient();

    this.logger.info("Processing transaction attachment", {
      transactionId,
      filePath: filePath.join("/"),
      mimetype,
      teamId,
    });

    if (mimetype === "image/heic") {
      this.logger.info("Converting HEIC to JPG", {
        filePath: filePath.join("/"),
      });

      const { data } = await withTimeout(
        supabase.storage.from("vault").download(filePath.join("/")),
        TIMEOUTS.FILE_DOWNLOAD,
        `File download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
      );

      if (!data) {
        throw new NonRetryableError("File not found", undefined, "validation");
      }

      const buffer = await data.arrayBuffer();

      if (buffer.byteLength > MAX_HEIC_FILE_SIZE) {
        const sizeMB = (buffer.byteLength / (1024 * 1024)).toFixed(2);
        this.logger.warn("HEIC file too large for processing", {
          transactionId,
          filePath: filePath.join("/"),
          sizeMB,
        });
        throw new NonRetryableError(
          `HEIC file too large (${sizeMB}MB)`,
          undefined,
          "validation",
        );
      }

      const { buffer: image } = await convertHeicToJpeg(buffer, this.logger);

      const { data: uploadedData } = await withTimeout(
        supabase.storage.from("vault").upload(filePath.join("/"), image, {
          contentType: "image/jpeg",
          upsert: true,
        }),
        TIMEOUTS.FILE_UPLOAD,
        `File upload timed out after ${TIMEOUTS.FILE_UPLOAD}ms`,
      );

      if (!uploadedData) {
        throw new Error("Failed to upload converted image");
      }
    }

    const { data: signedUrlData } = await withTimeout(
      supabase.storage.from("vault").createSignedUrl(filePath.join("/"), 600),
      TIMEOUTS.EXTERNAL_API,
      `Signed URL creation timed out after ${TIMEOUTS.EXTERNAL_API}ms`,
    );

    if (!signedUrlData) {
      throw new NonRetryableError("File not found", undefined, "validation");
    }

    const document = new DocumentClient();

    this.logger.info("Extracting tax information from document", {
      transactionId,
      mimetype,
    });

    const result = await withTimeout(
      document.getInvoiceOrReceipt({
        documentUrl: signedUrlData.signedUrl,
        mimetype,
      }),
      TIMEOUTS.DOCUMENT_PROCESSING,
      `Document extraction timed out after ${TIMEOUTS.DOCUMENT_PROCESSING}ms`,
    );

    // Update the transaction with the tax information
    if (result.tax_rate && result.tax_type) {
      this.logger.info("Updating transaction with tax information", {
        transactionId,
        taxRate: result.tax_rate,
        taxType: result.tax_type,
      });

      const db = getDb();
      await updateTransaction(db, {
        id: transactionId,
        teamId,
        taxRate: result.tax_rate ?? undefined,
        taxType: result.tax_type ?? undefined,
      });

      this.logger.info("Transaction updated with tax information", {
        transactionId,
        taxRate: result.tax_rate,
        taxType: result.tax_type,
      });
    } else {
      this.logger.info("No tax information found in document", {
        transactionId,
      });
    }

    await classifyFromExtraction({
      filePath,
      teamId,
      title: result.title,
      summary: result.summary,
      tags: result.tags,
      content: result.content,
      date: result.date,
      language: result.language,
      documentType: result.document_type,
      vendorName: result.name,
      invoiceNumber: result.invoice_number,
      logger: this.logger,
    });
  }
}
