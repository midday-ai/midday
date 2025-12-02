import { updateDocumentByPath } from "@midday/db/queries";
import { loadDocument } from "@midday/documents/loader";
import { getContentSample } from "@midday/documents/utils";
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import convert from "heic-convert";
import sharp from "sharp";
import type { ProcessDocumentPayload } from "../../schemas/documents";
import { getDb } from "../../utils/db";
import { detectFileTypeFromBlob } from "../../utils/detect-file-type";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

const MAX_SIZE = 1500;

/**
 * Process documents and images for classification
 * Handles HEIC conversion, document loading, and triggers classification
 */
export class ProcessDocumentProcessor extends BaseProcessor<ProcessDocumentPayload> {
  async process(job: Job<ProcessDocumentPayload>): Promise<void> {
    const { mimetype, filePath, teamId } = job.data;
    const supabase = createClient();
    const db = getDb();

    this.logger.info(
      {
        teamId,
        fileName: filePath.join("/"),
        mimetype,
      },
      "Processing document",
    );

    // Create activity for document upload
    try {
      await triggerJob(
        "notification",
        {
          type: "document_uploaded",
          teamId,
          fileName: filePath.join("/"),
          filePath: filePath,
          mimeType: mimetype,
        },
        "notifications",
      );
    } catch (error) {
      // Don't fail the entire process if notification fails
      this.logger.warn(
        {
          teamId,
          fileName: filePath.join("/"),
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Failed to trigger document_uploaded notification",
      );
    }

    try {
      const fileName = filePath.join("/");
      let fileData: Blob | null = null;
      let processedMimetype = mimetype;

      // Download file once and reuse for all operations
      // For HEIC files, we'll convert and reuse the converted data
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

        // Create Blob from converted image for reuse
        fileData = new Blob([image], { type: "image/jpeg" });
        processedMimetype = "image/jpeg";
      } else {
        // Download file for non-HEIC files
        const { data } = await withTimeout(
          supabase.storage.from("vault").download(fileName),
          TIMEOUTS.FILE_DOWNLOAD,
          `File download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
        );

        if (!data) {
          throw new Error("File not found");
        }

        fileData = data;
      }

      // Detect actual file type for application/octet-stream by checking magic bytes
      if (processedMimetype === "application/octet-stream" && fileData) {
        try {
          const detectionResult = await detectFileTypeFromBlob(fileData);

          if (detectionResult.detected) {
            this.logger.info(
              {
                fileName,
                teamId,
                detectedMimetype: detectionResult.mimetype,
              },
              "Detected file type from application/octet-stream",
            );
            processedMimetype = detectionResult.mimetype;
            // Recreate Blob with correct mimetype for further processing
            fileData = new Blob([detectionResult.buffer], {
              type: detectionResult.mimetype,
            });
          } else {
            // Unknown file type - log warning and skip processing
            this.logger.warn(
              {
                fileName,
                teamId,
                header: detectionResult.buffer.subarray(0, 8).toString("hex"),
              },
              "application/octet-stream file type could not be detected - skipping processing",
            );
            // Update document status to indicate it's not processable
            await updateDocumentByPath(db, {
              pathTokens: filePath,
              teamId,
              processingStatus: "failed",
            });
            return;
          }
        } catch (error) {
          this.logger.error(
            {
              fileName,
              teamId,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            "Failed to detect file type for application/octet-stream - will attempt to process as PDF",
          );
          // If detection fails, try to process as PDF (most common case)
          // Re-download the file since we may have consumed the buffer
          const { data: redownloadedData } = await withTimeout(
            supabase.storage.from("vault").download(fileName),
            TIMEOUTS.FILE_DOWNLOAD,
            `File re-download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
          );
          if (redownloadedData) {
            fileData = redownloadedData;
            processedMimetype = "application/pdf";
          } else {
            throw new Error("Failed to re-download file for type detection");
          }
        }
      }

      // If the file is an image, trigger image classification
      if (processedMimetype.startsWith("image/")) {
        this.logger.info(
          {
            fileName,
            teamId,
          },
          "Triggering image classification",
        );

        // Trigger image classification via BullMQ (fire and forget)
        await triggerJob(
          "classify-image",
          {
            fileName,
            teamId,
          },
          "documents",
        );

        return;
      }

      // Process document: load and classify
      let document: string;
      try {
        const loadedDoc = await loadDocument({
          content: fileData,
          metadata: { mimetype: processedMimetype },
        });

        if (!loadedDoc) {
          throw new Error("Failed to load document");
        }

        document = loadedDoc;
      } catch (error) {
        this.logger.error(
          {
            fileName,
            teamId,
            mimetype: processedMimetype,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Failed to load document - file may be corrupted or unsupported",
        );
        throw new Error(
          `Failed to load document: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      // Edge case: Validate document has content
      if (!document || document.trim().length === 0) {
        this.logger.warn(
          {
            fileName,
            teamId,
          },
          "Document loaded but has no extractable content",
        );
        // Don't throw - still try to classify, might be an image-only document
      }

      const sample = getContentSample(document);

      // Edge case: Validate sample has content
      if (!sample || sample.trim().length === 0) {
        this.logger.warn(
          {
            fileName,
            teamId,
            contentLength: document.length,
          },
          "Document sample is empty, skipping classification",
        );
        return; // Skip classification if no content
      }

      this.logger.info(
        {
          fileName,
          teamId,
          contentLength: document.length,
          sampleLength: sample.length,
        },
        "Triggering document classification",
      );

      // Trigger document classification via BullMQ (fire and forget)
      await triggerJob(
        "classify-document",
        {
          content: sample,
          fileName,
          teamId,
        },
        "documents",
      );

      // Create activity for successful document processing
      try {
        await triggerJob(
          "notification",
          {
            type: "document_processed",
            teamId,
            fileName,
            filePath: filePath,
            mimeType: mimetype,
            contentLength: document.length,
            sampleLength: sample.length,
          },
          "notifications",
        );
      } catch (error) {
        // Don't fail the entire process if notification fails
        this.logger.warn(
          {
            teamId,
            fileName,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Failed to trigger document_processed notification",
        );
      }

      this.logger.info(
        {
          fileName,
          teamId,
          contentLength: document.length,
          sampleLength: sample.length,
        },
        "Document processing completed",
      );
    } catch (error) {
      this.logger.error(
        {
          fileName: filePath.join("/"),
          teamId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Document processing failed",
      );

      await updateDocumentByPath(db, {
        pathTokens: filePath,
        teamId,
        processingStatus: "failed",
      });

      throw error;
    }
  }
}
