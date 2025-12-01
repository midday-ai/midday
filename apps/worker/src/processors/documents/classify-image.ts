import { updateDocumentByPath } from "@midday/db/queries";
import { limitWords } from "@midday/documents";
import { DocumentClassifier } from "@midday/documents/classifier";
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { ClassifyImagePayload } from "../../schemas/documents";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Classify images using AI to extract metadata and tags
 */
export class ClassifyImageProcessor extends BaseProcessor<ClassifyImagePayload> {
  async process(job: Job<ClassifyImagePayload>): Promise<void> {
    const { teamId, fileName } = job.data;
    const supabase = createClient();
    const db = getDb();

    await this.updateProgress(job, 10);

    this.logger.info(
      {
        fileName,
        teamId,
      },
      "Classifying image",
    );

    const { data: fileData } = await supabase.storage
      .from("vault")
      .download(fileName);

    if (!fileData) {
      throw new Error("File not found");
    }

    await this.updateProgress(job, 30);

    const content = await fileData.arrayBuffer();

    await this.updateProgress(job, 50);

    const classifier = new DocumentClassifier();
    const result = await classifier.classifyImage({ content });

    await this.updateProgress(job, 70);

    // fileName is the full path (e.g., "teamId/filename.jpg")
    // We need to split it into pathTokens for updateDocumentByPath
    const pathTokens = fileName.split("/");

    const updatedDocs = await updateDocumentByPath(db, {
      pathTokens,
      teamId,
      title: result.title ?? undefined,
      summary: result.summary ?? undefined,
      content: result.content ? limitWords(result.content, 10000) : undefined,
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
        "Document not found for image classification update",
      );
      throw new Error(`Document with path ${fileName} not found`);
    }

    const data = updatedDocs[0];
    if (!data || !data.id) {
      throw new Error(
        `Document update returned invalid data for path ${fileName}`,
      );
    }

    await this.updateProgress(job, 90);

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
