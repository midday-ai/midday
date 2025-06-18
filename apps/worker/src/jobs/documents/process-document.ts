import { loadDocument } from "@midday/documents/loader";
import { getContentSample } from "@midday/documents/utils";
import { createClient } from "@midday/supabase/job";
import { job } from "@worker/core/job";
import { documentsQueue } from "@worker/queues/queues";
import { z } from "zod";
import { classifyDocumentJob } from "./classify-document";
import { classifyImageJob } from "./classify-image";
import { convertHeicJob } from "./convert-heic";

export const processDocumentJob = job(
  "process-document",
  z.object({
    mimetype: z.string(),
    filePath: z.array(z.string()),
    teamId: z.string().uuid(),
  }),
  {
    queue: documentsQueue,
    attempts: 3,
    priority: 1,
    removeOnComplete: 100,
  },
  async ({ mimetype, filePath, teamId }, ctx) => {
    ctx.logger.info("Processing document for classification", {
      mimetype,
      filePath: filePath.join("/"),
      teamId,
    });

    const supabase = createClient();

    try {
      // If the file is a HEIC we need to convert it to a JPG
      if (mimetype === "image/heic") {
        ctx.logger.info("Converting HEIC file", { filePath });
        await convertHeicJob.trigger({
          filePath,
        });
      }

      // If the file is an image, we have a special classifier for it
      if (mimetype.startsWith("image/")) {
        ctx.logger.info("Processing image classification", { filePath });
        await classifyImageJob.trigger({
          fileName: filePath.join("/"),
          teamId,
        });

        return {
          filePath,
          teamId,
          processed: true,
          type: "image",
        };
      }

      // Process non-image documents
      ctx.logger.info("Downloading document for processing", { filePath });
      const { data: fileData } = await supabase.storage
        .from("vault")
        .download(filePath.join("/"));

      if (!fileData) {
        throw new Error("File not found");
      }

      ctx.logger.info("Loading document content", { filePath });
      const document = await loadDocument({
        content: fileData,
        metadata: { mimetype },
      });

      if (!document) {
        throw new Error("Document could not be loaded");
      }

      const sample = getContentSample(document);

      ctx.logger.info("Triggering document classification", { filePath });
      await classifyDocumentJob.trigger({
        content: sample,
        fileName: filePath.join("/"),
        teamId,
      });

      return {
        filePath,
        teamId,
        processed: true,
        type: "document",
        contentLength: sample.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      ctx.logger.error("Failed to process document", {
        filePath: filePath.join("/"),
        teamId,
        error: errorMessage,
        errorType: error?.constructor?.name,
      });

      // Update processing status to failed
      await supabase
        .from("documents")
        .update({
          processing_status: "failed",
        })
        .eq("name", filePath.join("/"));

      throw error;
    }
  },
);
