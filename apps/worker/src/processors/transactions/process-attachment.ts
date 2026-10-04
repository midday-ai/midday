import { updateTransaction } from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { triggerJob } from "@midday/job-client";
import { createSignedUrl, download } from "@midday/storage";
import { assertTeamKey } from "@midday/storage/keys";
import { uploadVaultObject } from "@midday/storage/vault";
import type { Job } from "bullmq";
import type { ProcessTransactionAttachmentPayload } from "../../schemas/transactions";
import { getDb } from "../../utils/db";
import { convertHeicToJpeg } from "../../utils/image-processing";
import { BaseProcessor } from "../base";

/**
 * Process transaction attachments (receipts/invoices)
 * Extracts tax information and updates the transaction
 */
export class ProcessTransactionAttachmentProcessor extends BaseProcessor<ProcessTransactionAttachmentPayload> {
  async process(job: Job<ProcessTransactionAttachmentPayload>): Promise<void> {
    const { transactionId, mimetype, filePath, teamId } = job.data;

    this.logger.info("Processing transaction attachment", {
      transactionId,
      filePath: filePath.join("/"),
      mimetype,
      teamId,
    });

    // If the file is a HEIC we need to convert it to a JPG
    if (mimetype === "image/heic") {
      this.logger.info("Converting HEIC to JPG", {
        filePath: filePath.join("/"),
      });

      const data = await download(
        "vault",
        assertTeamKey(teamId, filePath.join("/")),
      );

      if (!data) {
        throw new Error("File not found");
      }

      const buffer = await data.arrayBuffer();

      // Use shared HEIC conversion utility (resizes to 2048px)
      const { buffer: image } = await convertHeicToJpeg(buffer, this.logger);

      // Upload the converted image
      const uploadedData = await uploadVaultObject(getDb(), {
        teamId: teamId,
        key: filePath.join("/"),
        body: image,
        contentType: "image/jpeg",
      });

      if (!uploadedData) {
        throw new Error("Failed to upload converted image");
      }
    }

    const filename = filePath.at(-1);

    // Use 10 minutes expiration to ensure URL doesn't expire during processing
    // (document processing can take up to 120s, plus buffer for retries)
    const signedUrlData = await createSignedUrl(
      "vault",
      assertTeamKey(teamId, filePath.join("/")),
      { expiresIn: 600 },
    );

    if (!signedUrlData) {
      throw new Error("File not found");
    }

    const document = new DocumentClient();

    this.logger.info("Extracting tax information from document", {
      transactionId,
      filename,
      mimetype,
    });

    const result = await document.getInvoiceOrReceipt({
      documentUrl: signedUrlData,
      mimetype,
    });

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

      this.logger.info("Triggered document processing for classification", {
        transactionId,
        filePath: filePath.join("/"),
      });
    } catch (error) {
      this.logger.warn("Failed to trigger document processing (non-critical)", {
        transactionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Don't fail the entire process if document processing fails
    }
  }
}
