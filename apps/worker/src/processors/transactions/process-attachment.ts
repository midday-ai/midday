import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { ProcessTransactionAttachmentPayload } from "../../schemas/transactions";
import { convertHeicToJpeg } from "../../utils/image-processing";
import { BaseProcessor } from "../base";

/**
 * Process transaction attachments (receipts/invoices)
 * Converts HEIC images and triggers document classification
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

    // If the file is a HEIC we need to convert it to a JPG
    if (mimetype === "image/heic") {
      this.logger.info("Converting HEIC to JPG", {
        filePath: filePath.join("/"),
      });

      const { data } = await supabase.storage
        .from("vault")
        .download(filePath.join("/"));

      if (!data) {
        throw new Error("File not found");
      }

      const buffer = await data.arrayBuffer();

      // Use shared HEIC conversion utility (resizes to 2048px)
      const { buffer: image } = await convertHeicToJpeg(buffer, this.logger);

      // Upload the converted image
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
