import { limitWords } from "@midday/documents";
import { DocumentClassifier } from "@midday/documents/classifier";
import { createClient } from "@midday/supabase/job";
import { job } from "@worker/core/job";
import { documentsQueue } from "@worker/queues/queues";
import { z } from "zod";
import { embedDocumentTagsJob } from "./embed-document-tags";

export const classifyDocumentJob = job(
  "classify-document",
  z.object({
    content: z.string(),
    fileName: z.string(),
    teamId: z.string().uuid(),
  }),
  {
    queue: documentsQueue,
    attempts: 3,
    priority: 2,
    removeOnComplete: 100,
  },
  async ({ content, fileName, teamId }, ctx) => {
    ctx.logger.info("Classifying document", {
      fileName,
      teamId,
      contentLength: content.length,
    });

    const supabase = createClient();
    const classifier = new DocumentClassifier();

    try {
      ctx.logger.info("Running AI classification", { fileName });
      const result = await classifier.classifyDocument({ content });

      ctx.logger.info("Updating document with classification results", {
        fileName,
        title: result.title,
        hasDate: !!result.date,
        language: result.language,
        tagsCount: result.tags?.length || 0,
      });

      const { data, error } = await supabase
        .from("documents")
        .update({
          title: result.title,
          summary: result.summary,
          content: limitWords(content, 10000),
          date: result.date,
          language: result.language,
          // If the document has no tags, we consider it as processed
          processing_status:
            !result.tags || result.tags.length === 0 ? "completed" : undefined,
        })
        .eq("name", fileName)
        .select("id")
        .single();

      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }

      // If there are tags, trigger embedding job
      if (result.tags && result.tags.length > 0) {
        ctx.logger.info("Triggering tag embedding", {
          fileName,
          documentId: data.id,
          tagsCount: result.tags.length,
        });

        await embedDocumentTagsJob.trigger({
          documentId: data.id,
          tags: result.tags,
          teamId,
        });
      }

      ctx.logger.info("Document classification completed", {
        fileName,
        documentId: data.id,
        tagsCount: result.tags?.length || 0,
      });

      return {
        fileName,
        documentId: data.id,
        result: {
          title: result.title,
          summary: result.summary,
          date: result.date,
          language: result.language,
          tags: result.tags,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      ctx.logger.error("Document classification failed", {
        fileName,
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
        .eq("name", fileName);

      throw error;
    }
  },
);
