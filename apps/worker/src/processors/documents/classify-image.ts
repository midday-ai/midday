import { updateDocumentByPath } from "@midday/db/queries";
import { limitWords, mapLanguageCodeToPostgresConfig } from "@midday/documents";
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

    this.logger.info("Classifying image", {
      fileName,
      teamId,
    });

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

    // Validate title extraction - log if null and generate fallback
    let finalTitle = result.title;
    if (!finalTitle || finalTitle.trim().length === 0) {
      this.logger.warn(
        "Image classification returned null or empty title - generating fallback",
        {
          fileName,
          pathTokens,
          teamId,
          hasSummary: !!result.summary,
          hasDate: !!result.date,
          hasContent: !!result.content,
        },
      );

      // Generate fallback title from available metadata
      const fileNameWithoutExt =
        fileName
          .split("/")
          .pop()
          ?.replace(/\.[^/.]+$/, "") || "Image";
      const datePart = result.date ? ` - ${result.date}` : "";
      const summaryPart = result.summary
        ? ` - ${result.summary.substring(0, 50)}${result.summary.length > 50 ? "..." : ""}`
        : "";

      // Try to infer type from summary or content
      const contentSample = (
        result.content ||
        result.summary ||
        ""
      ).toLowerCase();
      let inferredType = "Image";
      if (contentSample.includes("receipt")) {
        inferredType = "Receipt";
      } else if (
        contentSample.includes("invoice") ||
        contentSample.includes("inv")
      ) {
        inferredType = "Invoice";
      } else if (contentSample.includes("logo")) {
        inferredType = "Logo";
      } else if (contentSample.includes("photo")) {
        inferredType = "Photo";
      }

      finalTitle = `${inferredType}${summaryPart || ` - ${fileNameWithoutExt}`}${datePart}`;

      this.logger.info("Generated fallback title for image", {
        fileName,
        generatedTitle: finalTitle,
      });
    }

    const updatedDocs = await updateDocumentByPath(db, {
      pathTokens,
      teamId,
      title: finalTitle ?? undefined,
      summary: result.summary ?? undefined,
      content: result.content ? limitWords(result.content, 10000) : undefined,
      date: result.date ?? undefined,
      language: mapLanguageCodeToPostgresConfig(result.language),
      // If the document has no tags, we consider it as processed
      processingStatus:
        !result.tags || result.tags.length === 0 ? "completed" : undefined,
    });

    if (!updatedDocs || updatedDocs.length === 0) {
      this.logger.error("Document not found for image classification update", {
        fileName,
        pathTokens,
        teamId,
      });
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
      this.logger.info("Triggering document tag embedding", {
        documentId: data.id,
        tagsCount: result.tags.length,
      });

      await triggerJob(
        "embed-document-tags",
        { documentId: data.id, tags: result.tags, teamId },
        "documents",
      );
    } else {
      this.logger.info("No tags found, document processing completed", {
        documentId: data.id,
      });
    }

    await this.updateProgress(job, 100);
  }
}
