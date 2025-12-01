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
