import { updateTransaction } from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import convert from "heic-convert";
import sharp from "sharp";
import type { ProcessTransactionAttachmentPayload } from "../../schemas/transactions";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

const MAX_SIZE = 1500;

/**
 * Process transaction attachments (receipts/invoices)
 * Extracts tax information and updates the transaction
 */
export class ProcessTransactionAttachmentProcessor extends BaseProcessor<ProcessTransactionAttachmentPayload> {
  async process(job: Job<ProcessTransactionAttachmentPayload>): Promise<void> {
    const { transactionId, mimetype, filePath, teamId } = job.data;
    const supabase = createClient();

    await this.updateProgress(job, 5);

    this.logger.info(
      {
        transactionId,
        filePath: filePath.join("/"),
        mimetype,
        teamId,
      },
      "Processing transaction attachment",
    );

    // If the file is a HEIC we need to convert it to a JPG
    if (mimetype === "image/heic") {
      this.logger.info(
        { filePath: filePath.join("/") },
        "Converting HEIC to JPG",
      );

      await this.updateProgress(job, 10);

      const { data } = await supabase.storage
        .from("vault")
        .download(filePath.join("/"));

      if (!data) {
        throw new Error("File not found");
      }

      const buffer = await data.arrayBuffer();

      const decodedImage = await convert({
        // @ts-ignore
        buffer: new Uint8Array(buffer),
        format: "JPEG",
        quality: 1,
      });

      const image = await sharp(decodedImage)
        .rotate()
        .resize({ width: MAX_SIZE })
        .toFormat("jpeg")
        .toBuffer();

      // Upload the converted image with .jpg extension
      const { data: uploadedData } = await supabase.storage
        .from("vault")
        .upload(filePath.join("/"), image, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadedData) {
        throw new Error("Failed to upload converted image");
      }
    }

    await this.updateProgress(job, 20);

    const filename = filePath.at(-1);

    const { data: signedUrlData } = await supabase.storage
      .from("vault")
      .createSignedUrl(filePath.join("/"), 60);

    if (!signedUrlData) {
      throw new Error("File not found");
    }

    await this.updateProgress(job, 30);

    const document = new DocumentClient();

    this.logger.info(
      {
        transactionId,
        filename,
        mimetype,
      },
      "Extracting tax information from document",
    );

    const result = await document.getInvoiceOrReceipt({
      documentUrl: signedUrlData.signedUrl,
      mimetype,
    });

    await this.updateProgress(job, 60);

    // Update the transaction with the tax information
    if (result.tax_rate && result.tax_type) {
      this.logger.info(
        {
          transactionId,
          taxRate: result.tax_rate,
          taxType: result.tax_type,
        },
        "Updating transaction with tax information",
      );

      const db = getDb();
      await updateTransaction(db, {
        id: transactionId,
        teamId,
        taxRate: result.tax_rate ?? undefined,
        taxType: result.tax_type ?? undefined,
      });

      this.logger.info(
        {
          transactionId,
          taxRate: result.tax_rate,
          taxType: result.tax_type,
        },
        "Transaction updated with tax information",
      );
    } else {
      this.logger.info(
        {
          transactionId,
        },
        "No tax information found in document",
      );
    }

    await this.updateProgress(job, 80);

    // NOTE: Process documents and images for classification
    // This is non-blocking, classification happens separately
    try {
      await triggerJob(
        "process-document",
        {
          mimetype,
          filePath,
          teamId,
        },
        "documents",
      );

      this.logger.info(
        {
          transactionId,
          filePath: filePath.join("/"),
        },
        "Triggered document processing for classification",
      );
    } catch (error) {
      this.logger.warn(
        {
          transactionId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Failed to trigger document processing (non-critical)",
      );
      // Don't fail the entire process if document processing fails
    }

    await this.updateProgress(job, 100);
  }
}
