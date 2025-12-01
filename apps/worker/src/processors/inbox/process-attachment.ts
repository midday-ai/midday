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
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
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

    const fileName = filePath.join("/");
    let processedMimetype = mimetype;

    // If the file is a HEIC we need to convert it to a JPG
    if (mimetype === "image/heic") {
      this.logger.info({ filePath: fileName }, "Converting HEIC to JPG");

      const { data } = await withTimeout(
        supabase.storage.from("vault").download(fileName),
        TIMEOUTS.FILE_DOWNLOAD,
        `File download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
      );

      if (!data) {
        throw new Error("File not found");
      }

      const buffer = await data.arrayBuffer();

      // Edge case: Validate buffer is not empty
      if (buffer.byteLength === 0) {
        throw new Error("Downloaded file is empty");
      }

      let decodedImage: ArrayBuffer;
      try {
        decodedImage = await convert({
          // @ts-ignore
          buffer: new Uint8Array(buffer),
          format: "JPEG",
          quality: 1,
        });
      } catch (error) {
        this.logger.error(
          {
            filePath: fileName,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Failed to decode HEIC image - file may be corrupted",
        );
        throw new Error(
          `Failed to convert HEIC image: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      // Edge case: Validate decoded image
      if (!decodedImage || decodedImage.byteLength === 0) {
        throw new Error("Decoded image is empty");
      }

      let image: Buffer;
      try {
        image = await sharp(Buffer.from(decodedImage))
          .rotate()
          .resize({ width: MAX_SIZE })
          .toFormat("jpeg")
          .toBuffer();
      } catch (error) {
        this.logger.error(
          {
            filePath: fileName,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Failed to process image with sharp - file may be corrupted",
        );
        throw new Error(
          `Failed to process image: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      // Upload the converted image
      const { data: uploadedData } = await withTimeout(
        supabase.storage.from("vault").upload(fileName, image, {
          contentType: "image/jpeg",
          upsert: true,
        }),
        TIMEOUTS.FILE_UPLOAD,
        `File upload timed out after ${TIMEOUTS.FILE_UPLOAD}ms`,
      );

      if (!uploadedData) {
        throw new Error("Failed to upload converted image");
      }

      processedMimetype = "image/jpeg";
    }

    const filename = filePath.at(-1);

    // Edge case: Validate filename exists
    if (!filename || filename.trim().length === 0) {
      throw new Error("Invalid file path: filename is missing");
    }

    // Edge case: Validate file size is reasonable
    if (size <= 0) {
      throw new Error(`Invalid file size: ${size} bytes`);
    }

    // Check if inbox item already exists (for retry scenarios or manual uploads)
    let inboxData = await getInboxByFilePath(db, {
      filePath,
      teamId,
    });

    this.logger.info(
      {
        filePath: fileName,
        existingItem: !!inboxData,
        existingStatus: inboxData?.status,
        teamId,
      },
      "Processing attachment",
    );

    // Create inbox item if it doesn't exist (for non-manual uploads)
    // or update existing item status if it was created manually
    if (!inboxData) {
      this.logger.info({ filePath: fileName }, "Creating new inbox item");
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
          filePath: fileName,
        },
        "Found existing inbox item already in processing status",
      );
    } else {
      this.logger.info(
        {
          inboxId: inboxData.id,
          status: inboxData.status,
          filePath: fileName,
        },
        "Found existing inbox item with status",
      );
    }

    if (!inboxData) {
      throw new Error("Inbox data not found");
    }

    // Create signed URL for document processing
    const { data: signedUrlData } = await withTimeout(
      supabase.storage.from("vault").createSignedUrl(fileName, 60),
      TIMEOUTS.EXTERNAL_API,
      `Signed URL creation timed out after ${TIMEOUTS.EXTERNAL_API}ms`,
    );

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
          mimetype: processedMimetype,
          referenceId,
          teamName: teamData?.name,
        },
        "Starting document processing",
      );

      // Process document with timeout
      const result = await withTimeout(
        document.getInvoiceOrReceipt({
          documentUrl: signedUrlData.signedUrl,
          mimetype: processedMimetype,
          companyName: teamData?.name,
        }),
        TIMEOUTS.DOCUMENT_PROCESSING,
        `Document processing timed out after ${TIMEOUTS.DOCUMENT_PROCESSING}ms`,
      );

      this.logger.info(
        {
          inboxId: inboxData.id,
          resultType: result.type,
          hasAmount: !!result.amount,
        },
        "Document processing completed",
      );

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

      // Trigger parallel jobs (non-blocking)
      // Process documents and embedding in parallel for better performance
      const [documentJobResult, embedJobResult] = await Promise.allSettled([
        // Process documents and images for classification
        triggerJob(
          "process-document",
          {
            mimetype: processedMimetype,
            filePath,
            teamId,
          },
          "documents",
        ).catch((error) => {
          this.logger.warn(
            {
              inboxId: inboxData.id,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            "Failed to trigger document processing (non-critical)",
          );
          // Don't fail the entire process if document processing fails
          return null;
        }),
        // Create embedding (non-blocking - allows parallel processing)
        triggerJob(
          "embed-inbox",
          {
            inboxId: inboxData.id,
            teamId,
          },
          "inbox",
        ),
      ]);

      if (embedJobResult.status === "fulfilled") {
        this.logger.info(
          {
            inboxId: inboxData.id,
            teamId,
          },
          "Triggered inbox embedding",
        );
      }

      // After embedding is complete, trigger efficient matching
      // Note: batch-process-matching will wait for embedding to complete internally
      await triggerJob(
        "batch-process-matching",
        {
          teamId,
          inboxIds: [inboxData.id],
        },
        "inbox",
      );

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
