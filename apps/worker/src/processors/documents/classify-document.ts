import { updateDocumentByPath } from "@midday/db/queries";
import { limitWords, mapLanguageCodeToPostgresConfig } from "@midday/documents";
import { DocumentClassifier } from "@midday/documents/classifier";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import type { ClassifyDocumentPayload } from "../../schemas/documents";
import { getDb } from "../../utils/db";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

/**
 * Classify documents using AI to extract metadata and tags
 */
export class ClassifyDocumentProcessor extends BaseProcessor<ClassifyDocumentPayload> {
  async process(job: Job<ClassifyDocumentPayload>): Promise<void> {
    const { content, fileName, teamId } = job.data;
    const db = getDb();

    // fileName is the full path (e.g., "teamId/filename.pdf")
    // We need to split it into pathTokens for updateDocumentByPath
    const pathTokens = fileName.split("/");

    this.logger.info(
      {
        fileName,
        pathTokens,
        teamId,
        contentLength: content.length,
      },
      "Classifying document",
    );

    const classifier = new DocumentClassifier();
    const result = await withTimeout(
      classifier.classifyDocument({ content }),
      TIMEOUTS.EXTERNAL_API,
      `Document classification timed out after ${TIMEOUTS.EXTERNAL_API}ms`,
    );

    const updatedDocs = await updateDocumentByPath(db, {
      pathTokens,
      teamId,
      title: result.title ?? undefined,
      summary: result.summary ?? undefined,
      content: limitWords(content, 10000),
      date: result.date ?? undefined,
      language: mapLanguageCodeToPostgresConfig(result.language),
      // If the document has no tags, we consider it as processed
      processingStatus:
        !result.tags || result.tags.length === 0 ? "completed" : undefined,
    });

    if (!updatedDocs || updatedDocs.length === 0) {
      this.logger.error(
        {
          fileName,
          pathTokens,
          teamId,
        },
        "Document not found for classification update",
      );
      throw new Error(`Document with path ${fileName} not found`);
    }

    const data = updatedDocs[0];
    if (!data || !data.id) {
      throw new Error(
        `Document update returned invalid data for path ${fileName}`,
      );
    }

    if (result.tags && result.tags.length > 0) {
      this.logger.info(
        {
          documentId: data.id,
          tagsCount: result.tags.length,
        },
        "Triggering document tag embedding",
      );

      // Trigger tag embedding (fire and forget)
      await triggerJob(
        "embed-document-tags",
        {
          documentId: data.id,
          tags: result.tags,
          teamId,
        },
        "documents",
      );
    } else {
      this.logger.info(
        {
          documentId: data.id,
        },
        "No tags found, document processing completed",
      );
    }
  }
}
