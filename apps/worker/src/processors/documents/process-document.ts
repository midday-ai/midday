import { loadDocument } from "@midday/documents/loader";
import { classifyText, extractDocument } from "@midday/documents/ocr";
import { isMimeTypeSupportedForProcessing } from "@midday/documents/utils";
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { ProcessDocumentPayload } from "../../schemas/documents";
import { classifyFromExtraction } from "../../utils/classify-from-extraction";
import { getDb } from "../../utils/db";
import { detectFileTypeFromBlob } from "../../utils/detect-file-type";
import { updateDocumentWithRetry } from "../../utils/document-update";
import {
  NonRetryableError,
  UnsupportedFileTypeError,
} from "../../utils/error-classification";
import {
  convertHeicToJpeg,
  MAX_HEIC_FILE_SIZE,
} from "../../utils/image-processing";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

const PDF_IMAGE_TYPES = new Set([
  "application/pdf",
  "application/x-pdf",
  "application/octet-stream",
]);

function isPdfOrImage(mimetype: string): boolean {
  return PDF_IMAGE_TYPES.has(mimetype) || mimetype.startsWith("image/");
}

/**
 * Process documents for classification using Mistral.
 * PDFs and images: Mistral OCR (extractDocument)
 * Other file types: langchain text extraction + Mistral completion (classifyText)
 */
export class ProcessDocumentProcessor extends BaseProcessor<ProcessDocumentPayload> {
  async process(job: Job<ProcessDocumentPayload>): Promise<void> {
    const processStartTime = Date.now();
    const { mimetype, filePath, teamId } = job.data;
    const supabase = createClient();
    const db = getDb();
    const fileName = filePath.join("/");

    this.logger.info("Starting process-document job", {
      jobId: job.id,
      teamId,
      fileName,
      mimetype,
    });

    try {
      await triggerJob(
        "notification",
        {
          type: "document_uploaded",
          teamId,
          fileName,
          filePath,
          mimeType: mimetype,
        },
        "notifications",
      );
    } catch (error) {
      this.logger.warn("Failed to trigger document_uploaded notification", {
        teamId,
        fileName,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    try {
      let fileData: Blob | null = null;
      let processedMimetype = mimetype;

      // HEIC conversion
      if (mimetype === "image/heic") {
        this.logger.info("Converting HEIC to JPG", { filePath: fileName });

        const { data } = await withTimeout(
          supabase.storage.from("vault").download(fileName),
          TIMEOUTS.FILE_DOWNLOAD,
          `File download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
        );

        if (!data) {
          throw new NonRetryableError(
            "File not found",
            undefined,
            "validation",
          );
        }

        const buffer = await data.arrayBuffer();
        const fileSizeMB = (buffer.byteLength / (1024 * 1024)).toFixed(2);

        if (buffer.byteLength > MAX_HEIC_FILE_SIZE) {
          this.logger.warn(
            "HEIC file too large for processing - completing with filename",
            { fileName, teamId, sizeBytes: buffer.byteLength },
          );
          await updateDocumentWithRetry(
            db,
            {
              pathTokens: filePath,
              teamId,
              title: filePath.at(-1) ?? "Large HEIC Image",
              summary: `Large image (${fileSizeMB}MB) - processing skipped`,
              processingStatus: "completed",
            },
            this.logger,
          );
          return;
        }

        try {
          const { buffer: image } = await convertHeicToJpeg(
            buffer,
            this.logger,
          );

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

          fileData = new Blob([image], { type: "image/jpeg" });
          processedMimetype = "image/jpeg";
        } catch (conversionError) {
          this.logger.error(
            "HEIC conversion failed - completing with fallback",
            {
              fileName,
              teamId,
              error:
                conversionError instanceof Error
                  ? conversionError.message
                  : "Unknown error",
            },
          );
          await updateDocumentWithRetry(
            db,
            {
              pathTokens: filePath,
              teamId,
              title: filePath.at(-1) ?? "HEIC Image",
              summary: "HEIC conversion failed - original file preserved",
              processingStatus: "completed",
            },
            this.logger,
          );
          return;
        }
      } else {
        const { data } = await withTimeout(
          supabase.storage.from("vault").download(fileName),
          TIMEOUTS.FILE_DOWNLOAD,
          `File download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
        );

        if (!data) {
          throw new NonRetryableError(
            "File not found",
            undefined,
            "validation",
          );
        }

        fileData = data;
      }

      // Detect actual file type for application/octet-stream
      if (processedMimetype === "application/octet-stream" && fileData) {
        try {
          const detectionResult = await detectFileTypeFromBlob(fileData);

          if (detectionResult.detected) {
            this.logger.info("Detected file type from octet-stream", {
              fileName,
              detectedMimetype: detectionResult.mimetype,
            });
            processedMimetype = detectionResult.mimetype;
            fileData = new Blob([detectionResult.buffer], {
              type: detectionResult.mimetype,
            });
          } else {
            this.logger.warn("Could not detect file type - skipping", {
              fileName,
              teamId,
            });
            await updateDocumentWithRetry(
              db,
              {
                pathTokens: filePath,
                teamId,
                processingStatus: "failed",
              },
              this.logger,
            );
            return;
          }
        } catch (error) {
          this.logger.error("File type detection failed - trying as PDF", {
            fileName,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          processedMimetype = "application/pdf";
        }
      }

      if (!isMimeTypeSupportedForProcessing(processedMimetype)) {
        throw new UnsupportedFileTypeError(processedMimetype, fileName);
      }

      // Route: PDFs and images -> Mistral OCR
      if (isPdfOrImage(processedMimetype)) {
        const { data: signedUrlData } = await withTimeout(
          supabase.storage.from("vault").createSignedUrl(fileName, 600),
          TIMEOUTS.EXTERNAL_API,
          `Signed URL creation timed out after ${TIMEOUTS.EXTERNAL_API}ms`,
        );

        if (!signedUrlData) {
          throw new Error("Failed to create signed URL");
        }

        this.logger.info("Extracting with Mistral OCR", {
          fileName,
          mimetype: processedMimetype,
        });

        const { data, content } = await withTimeout(
          extractDocument({
            documentUrl: signedUrlData.signedUrl,
            mimetype: processedMimetype,
          }),
          TIMEOUTS.DOCUMENT_PROCESSING,
          `OCR extraction timed out after ${TIMEOUTS.DOCUMENT_PROCESSING}ms`,
        );

        await classifyFromExtraction({
          filePath,
          teamId,
          title: data.title ?? null,
          summary: data.summary ?? null,
          tags: data.tags ?? null,
          content: content || null,
          date: data.invoice_date ?? null,
          language: data.language ?? null,
          documentType: data.document_type ?? null,
          vendorName: data.vendor_name ?? null,
          invoiceNumber: data.invoice_number ?? null,
          logger: this.logger,
        });
      } else {
        // Route: Other file types -> langchain + Mistral completion
        this.logger.info("Extracting text with langchain", {
          fileName,
          mimetype: processedMimetype,
        });

        let textContent: string | null = null;

        try {
          textContent = await withTimeout(
            loadDocument({
              content: fileData,
              metadata: { mimetype: processedMimetype },
            }),
            60_000,
            "Document parsing timed out after 60000ms",
          );
        } catch (error) {
          this.logger.warn(
            "Text extraction failed - completing with fallback",
            {
              fileName,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          );
        }

        if (!textContent || textContent.trim().length === 0) {
          await updateDocumentWithRetry(
            db,
            {
              pathTokens: filePath,
              teamId,
              processingStatus: "completed",
            },
            this.logger,
          );
          return;
        }

        this.logger.info("Classifying with Mistral completion", {
          fileName,
          contentLength: textContent.length,
        });

        let classification: Awaited<ReturnType<typeof classifyText>> | null =
          null;

        try {
          classification = await withTimeout(
            classifyText({
              content: textContent,
              fileName: filePath.at(-1),
            }),
            TIMEOUTS.DOCUMENT_PROCESSING,
            `Text classification timed out after ${TIMEOUTS.DOCUMENT_PROCESSING}ms`,
          );
        } catch (error) {
          this.logger.warn(
            "Text classification failed - completing with content only",
            {
              fileName,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          );
        }

        await classifyFromExtraction({
          filePath,
          teamId,
          title: classification?.title ?? null,
          summary: classification?.summary ?? null,
          tags: classification?.tags ?? null,
          content: textContent,
          date: classification?.date ?? null,
          language: classification?.language ?? null,
          documentType: null,
          vendorName: null,
          invoiceNumber: null,
          logger: this.logger,
        });
      }

      const totalDuration = Date.now() - processStartTime;
      this.logger.info("process-document completed", {
        jobId: job.id,
        fileName,
        teamId,
        totalDuration: `${totalDuration}ms`,
      });
    } catch (error) {
      this.logger.error("Document processing failed", {
        fileName,
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
