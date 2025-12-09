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

    this.logger.info("Classifying document", {
      fileName,
      pathTokens,
      teamId,
      contentLength: content.length,
    });

    const classifier = new DocumentClassifier();
    const result = await withTimeout(
      classifier.classifyDocument({ content }),
      TIMEOUTS.EXTERNAL_API,
      `Document classification timed out after ${TIMEOUTS.EXTERNAL_API}ms`,
    );

    // Validate title extraction - log if null and generate fallback
    let finalTitle = result.title;
    if (!finalTitle || finalTitle.trim().length === 0) {
      this.logger.warn(
        "Classification returned null or empty title - generating fallback",
        {
          fileName,
          pathTokens,
          teamId,
          hasSummary: !!result.summary,
          hasDate: !!result.date,
          contentLength: content.length,
        },
      );

      // Generate fallback title from available metadata
      const fileNameWithoutExt =
        fileName
          .split("/")
          .pop()
          ?.replace(/\.[^/.]+$/, "") || "Document";
      const datePart = result.date ? ` - ${result.date}` : "";
      const summaryPart = result.summary
        ? ` - ${result.summary.substring(0, 50)}${result.summary.length > 50 ? "..." : ""}`
        : "";

      // Try to extract company name or key info from content sample
      const contentSample = content.substring(0, 200).toLowerCase();
      let inferredType = "Document";
      if (contentSample.includes("invoice") || contentSample.includes("inv")) {
        inferredType = "Invoice";
      } else if (contentSample.includes("receipt")) {
        inferredType = "Receipt";
      } else if (
        contentSample.includes("contract") ||
        contentSample.includes("agreement")
      ) {
        inferredType = "Contract";
      } else if (contentSample.includes("report")) {
        inferredType = "Report";
      }

      finalTitle = `${inferredType}${summaryPart || ` - ${fileNameWithoutExt}`}${datePart}`;

      this.logger.info("Generated fallback title", {
        fileName,
        generatedTitle: finalTitle,
      });
    }

    const updatedDocs = await updateDocumentByPath(db, {
      pathTokens,
      teamId,
      title: finalTitle ?? undefined,
      summary: result.summary ?? undefined,
      content: limitWords(content, 10000),
      date: result.date ?? undefined,
      language: mapLanguageCodeToPostgresConfig(result.language),
      // If the document has no tags, we consider it as processed
      processingStatus:
        !result.tags || result.tags.length === 0 ? "completed" : undefined,
    });

    if (!updatedDocs || updatedDocs.length === 0) {
      this.logger.error("Document not found for classification update", {
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

    if (result.tags && result.tags.length > 0) {
      this.logger.info("Triggering document tag embedding", {
        documentId: data.id,
        tagsCount: result.tags.length,
      });

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
      this.logger.info("No tags found, document processing completed", {
        documentId: data.id,
      });
    }
  }
}
