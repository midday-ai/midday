import { updateDocument } from "@midday/db/queries";
import { limitWords } from "@midday/documents";
import { DocumentClassifier } from "@midday/documents/classifier";
import { job } from "@worker/core/job";
import { documentsQueue } from "@worker/queues/queues";
import { z } from "zod";
import { embedDocumentTagsJob } from "./embed-document-tags";

export const classifyImageJob = job(
  "classify-image",
  z.object({
    teamId: z.string().uuid(),
    fileName: z.string(),
  }),
  {
    queue: documentsQueue,
    attempts: 3,
    priority: 2,
    removeOnComplete: 100,
  },
  async ({ teamId, fileName }, ctx) => {
    ctx.logger.info("Classifying image", {
      fileName,
      teamId,
    });

    const classifier = new DocumentClassifier();

    try {
      ctx.logger.info("Downloading image file", { fileName });
      const { data: fileData } = await ctx.supabase.storage
        .from("vault")
        .download(fileName);

      if (!fileData) {
        throw new Error("File not found");
      }

      const content = await fileData.arrayBuffer();

      ctx.logger.info("Running AI image classification", { fileName });
      const result = await classifier.classifyImage({ content });

      ctx.logger.info("Updating document with image classification results", {
        fileName,
        title: result.title,
        hasDate: !!result.date,
        language: result.language,
        tagsCount: result.tags?.length || 0,
      });

      const [updatedDocument] = await updateDocument(ctx.db, {
        teamId,
        fileName,
        title: result.title || undefined,
        summary: result.summary || undefined,
        content: result.content ? limitWords(result.content, 10000) : undefined,
        date: result.date || undefined,
        language: result.language || undefined,
        // If the document has no tags, we consider it as processed
        processingStatus:
          !result.tags || result.tags.length === 0 ? "completed" : undefined,
      });

      if (!updatedDocument) {
        throw new Error(
          "Failed to update document with image classification results",
        );
      }

      // If there are tags, trigger embedding job
      if (result.tags && result.tags.length > 0) {
        ctx.logger.info("Triggering tag embedding for image", {
          fileName,
          documentId: updatedDocument.id,
          tagsCount: result.tags.length,
        });

        await embedDocumentTagsJob.trigger({
          documentId: updatedDocument.id,
          tags: result.tags,
          teamId,
        });
      }

      ctx.logger.info("Image classification completed", {
        fileName,
        documentId: updatedDocument.id,
        tagsCount: result.tags?.length || 0,
      });

      return {
        fileName,
        documentId: updatedDocument.id,
        result: {
          title: result.title,
          summary: result.summary,
          content: result.content,
          date: result.date,
          language: result.language,
          tags: result.tags,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      ctx.logger.error("Image classification failed", {
        fileName,
        teamId,
        error: errorMessage,
        errorType: error?.constructor?.name,
      });

      // Update processing status to failed
      await updateDocument(ctx.db, {
        teamId,
        fileName,
        processingStatus: "failed",
      });

      throw error;
    }
  },
);
