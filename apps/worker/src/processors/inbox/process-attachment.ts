import {
  createInbox,
  getInboxByFilePath,
  getTeamById,
  groupRelatedInboxItems,
  updateInbox,
  updateInboxWithProcessedData,
} from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import convert from "heic-convert";
import sharp from "sharp";
import type { ProcessAttachmentPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

const MAX_SIZE = 1500;

export class ProcessAttachmentProcessor extends BaseProcessor<ProcessAttachmentPayload> {
  async process(job: Job<ProcessAttachmentPayload>): Promise<void> {
    const {
      teamId,
      mimetype,
      size,
      filePath,
      referenceId,
      website,
      senderEmail,
      inboxAccountId,
    } = job.data;
    const supabase = createClient();
    const db = getDb();

    await this.updateProgress(job, 5);

    // If the file is a HEIC we need to convert it to a JPG
    if (mimetype === "image/heic") {
      this.logger.info(
        { filePath: filePath.join("/") },
        "Converting HEIC to JPG",
      );

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

    await this.updateProgress(job, 10);

    const filename = filePath.at(-1);

    // Check if inbox item already exists (for retry scenarios or manual uploads)
    let inboxData = await getInboxByFilePath(db, {
      filePath,
      teamId,
    });

    this.logger.info(
      {
        filePath: filePath.join("/"),
        existingItem: !!inboxData,
        existingStatus: inboxData?.status,
        teamId,
      },
      "Processing attachment",
    );

    // Create inbox item if it doesn't exist (for non-manual uploads)
    // or update existing item status if it was created manually
    if (!inboxData) {
      this.logger.info(
        { filePath: filePath.join("/") },
        "Creating new inbox item",
      );
      inboxData = await createInbox(db, {
        // NOTE: If we can't parse the name using OCR this will be the fallback name
        displayName: filename ?? "Unknown",
        teamId,
        filePath,
        fileName: filename ?? "Unknown",
        contentType: mimetype,
        size,
        referenceId,
        website,
        senderEmail,
        inboxAccountId,
        status: "processing", // Set as processing when created by job
      });
    } else if (inboxData.status === "processing") {
      this.logger.info(
        {
          inboxId: inboxData.id,
          filePath: filePath.join("/"),
        },
        "Found existing inbox item already in processing status",
      );
    } else {
      this.logger.info(
        {
          inboxId: inboxData.id,
          status: inboxData.status,
          filePath: filePath.join("/"),
        },
        "Found existing inbox item with status",
      );
    }

    if (!inboxData) {
      throw new Error("Inbox data not found");
    }

    await this.updateProgress(job, 20);

    const { data: signedUrlData } = await supabase.storage
      .from("vault")
      .createSignedUrl(filePath.join("/"), 60);

    if (!signedUrlData) {
      throw new Error("File not found");
    }

    try {
      // Fetch team data to provide context for OCR extraction
      const teamData = await getTeamById(db, teamId);

      const document = new DocumentClient();

      this.logger.info(
        {
          inboxId: inboxData.id,
          mimetype,
          referenceId,
          teamName: teamData?.name,
        },
        "Starting document processing",
      );

      await this.updateProgress(job, 30);

      const result = await document.getInvoiceOrReceipt({
        documentUrl: signedUrlData.signedUrl,
        mimetype,
        companyName: teamData?.name,
      });

      this.logger.info(
        {
          inboxId: inboxData.id,
          resultType: result.type,
          hasAmount: !!result.amount,
        },
        "Document processing completed",
      );

      await this.updateProgress(job, 50);

      await updateInboxWithProcessedData(db, {
        id: inboxData.id,
        amount: result.amount ?? undefined,
        currency: result.currency ?? undefined,
        displayName: result.name ?? undefined,
        website: result.website ?? undefined,
        date: result.date ?? undefined,
        taxAmount: result.tax_amount ?? undefined,
        taxRate: result.tax_rate ?? undefined,
        taxType: result.tax_type ?? undefined,
        type: result.type as "invoice" | "expense" | null | undefined,
        invoiceNumber: result.invoice_number ?? undefined,
        status: "analyzing", // Keep analyzing until matching is complete
      });

      await this.updateProgress(job, 60);

      // Group related inbox items after storing invoice number
      try {
        await groupRelatedInboxItems(db, {
          inboxId: inboxData.id,
          teamId,
        });
      } catch (error) {
        this.logger.error(
          {
            inboxId: inboxData.id,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Failed to group related inbox items",
        );
        // Don't fail the entire process if grouping fails
      }

      await this.updateProgress(job, 70);

      // NOTE: Process documents and images for classification
      // This is a non-critical operation, so we don't await it
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
      } catch (error) {
        this.logger.warn(
          {
            inboxId: inboxData.id,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Failed to trigger document processing (non-critical)",
        );
        // Don't fail the entire process if document processing fails
      }

      await this.updateProgress(job, 80);

      // Create embedding (non-blocking - allows parallel processing)
      await triggerJob(
        "embed-inbox",
        {
          inboxId: inboxData.id,
          teamId,
        },
        "inbox",
      );

      this.logger.info(
        {
          inboxId: inboxData.id,
          teamId,
        },
        "Triggered inbox embedding",
      );

      await this.updateProgress(job, 90);

      // After embedding is complete, trigger efficient matching
      await triggerJob(
        "batch-process-matching",
        {
          teamId,
          inboxIds: [inboxData.id],
        },
        "inbox",
      );

      await this.updateProgress(job, 100);

      this.logger.info(
        {
          inboxId: inboxData.id,
          teamId,
        },
        "Triggered efficient inbox matching",
      );
    } catch (error) {
      this.logger.error(
        {
          inboxId: inboxData.id,
          error: error instanceof Error ? error.message : "Unknown error",
          referenceId,
          mimetype,
        },
        "Document processing failed",
      );

      // Re-throw timeout errors to trigger retry
      if (error instanceof Error && error.name === "AbortError") {
        this.logger.warn(
          {
            inboxId: inboxData.id,
            referenceId,
            errorType: error.name,
            errorMessage: error.message,
          },
          "Document processing failed with retryable error, will retry",
        );
        throw error;
      }

      // For non-retryable errors, mark as pending with fallback name
      this.logger.info(
        {
          inboxId: inboxData.id,
          referenceId,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
        "Document processing failed, marking as pending with fallback name",
      );

      await updateInbox(db, {
        id: inboxData.id,
        teamId,
        status: "pending",
      });

      throw error;
    }
  }
}
