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

    await this.updateProgress(job, 5);

    // Create activity for document upload (via Trigger.dev for now)
    // TODO: Port notification system to BullMQ
    this.logger.info(
      {
        teamId,
        fileName: filePath.join("/"),
        mimetype,
      },
      "Processing document",
    );

    await this.updateProgress(job, 10);

    try {
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

      await this.updateProgress(job, 30);

      // If the file is an image, we have a special classifier for it
      if (mimetype.startsWith("image/")) {
        this.logger.info(
          {
            fileName: filePath.join("/"),
            teamId,
          },
          "Triggering image classification",
        );

        await this.updateProgress(job, 50);

        // Trigger image classification via BullMQ
        await triggerJob(
          "classify-image",
          {
            fileName: filePath.join("/"),
            teamId,
          },
          "documents",
        );

        await this.updateProgress(job, 100);
        return;
      }

      await this.updateProgress(job, 40);

      const { data: fileData } = await supabase.storage
        .from("vault")
        .download(filePath.join("/"));

      if (!fileData) {
        throw new Error("File not found");
      }

      await this.updateProgress(job, 50);

      const document = await loadDocument({
        content: fileData,
        metadata: { mimetype },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      await this.updateProgress(job, 60);

      const sample = getContentSample(document);

      this.logger.info(
        {
          fileName: filePath.join("/"),
          teamId,
          contentLength: document.length,
          sampleLength: sample.length,
        },
        "Triggering document classification",
      );

      await this.updateProgress(job, 70);

      // Trigger document classification via BullMQ
      await triggerJob(
        "classify-document",
        {
          content: sample,
          fileName: filePath.join("/"),
          teamId,
        },
        "documents",
      );

      await this.updateProgress(job, 90);

      // Create activity for successful document processing (via Trigger.dev)
      // TODO: Port notification system to BullMQ
      this.logger.info(
        {
          fileName: filePath.join("/"),
          teamId,
          contentLength: document.length,
          sampleLength: sample.length,
        },
        "Document processing completed",
      );

      await this.updateProgress(job, 100);
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
