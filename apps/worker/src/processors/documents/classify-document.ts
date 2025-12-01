import { updateDocumentByPath } from "@midday/db/queries";
import { limitWords } from "@midday/documents";
import { DocumentClassifier } from "@midday/documents/classifier";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import type { ClassifyDocumentPayload } from "../../schemas/documents";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Classify documents using AI to extract metadata and tags
 */
export class ClassifyDocumentProcessor extends BaseProcessor<ClassifyDocumentPayload> {
  async process(job: Job<ClassifyDocumentPayload>): Promise<void> {
    const { content, fileName, teamId } = job.data;
    const db = getDb();

    await this.updateProgress(job, 10);

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

    await this.updateProgress(job, 30);

    const classifier = new DocumentClassifier();
    const result = await classifier.classifyDocument({ content });

    await this.updateProgress(job, 60);

    const updatedDocs = await updateDocumentByPath(db, {
      pathTokens,
      teamId,
      title: result.title ?? undefined,
      summary: result.summary ?? undefined,
      content: limitWords(content, 10000),
      date: result.date ?? undefined,
      language: result.language ?? undefined,
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

    await this.updateProgress(job, 80);

    if (result.tags && result.tags.length > 0) {
      this.logger.info(
        {
          documentId: data.id,
          tagsCount: result.tags.length,
        },
        "Triggering document tag embedding",
      );

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

    await this.updateProgress(job, 100);
  }
}
