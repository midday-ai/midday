import { limitWords, mapLanguageCodeToPostgresConfig } from "@midday/documents";
import { DocumentClassifier } from "@midday/documents/classifier";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import type { ClassifyDocumentPayload } from "../../schemas/documents";
import { getDb } from "../../utils/db";
import { updateDocumentWithRetry } from "../../utils/document-update";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

/**
 * Classification result type for graceful error handling
 */
interface ClassificationResult {
  title: string | null;
  summary: string | null;
  date: string | null;
  language: string | null;
  tags: string[] | null;
}

/**
 * Classify documents using AI to extract metadata and tags
 * Uses graceful degradation - if AI fails, document is still marked completed
 * with null values so users can access the file and retry classification later
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

    // Attempt AI classification with graceful fallback
    let classificationResult: ClassificationResult | null = null;
    let classificationFailed = false;

    try {
      const classifier = new DocumentClassifier();
      classificationResult = await withTimeout(
        classifier.classifyDocument({ content }),
        TIMEOUTS.AI_CLASSIFICATION,
        `Document classification timed out after ${TIMEOUTS.AI_CLASSIFICATION}ms`,
      );
    } catch (error) {
      // Log error but don't fail - we'll complete with fallback
      classificationFailed = true;
      this.logger.warn("AI classification failed, completing with fallback", {
        fileName,
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : "Unknown",
        contentLength: content.length,
      });
    }

    // Process title - use AI result, generate fallback, or leave null for retry
    let finalTitle: string | null = null;

    if (
      classificationResult?.title &&
      classificationResult.title.trim().length > 0
    ) {
      finalTitle = classificationResult.title;
    } else if (classificationResult && !classificationFailed) {
      // AI returned but with empty title - generate fallback from available data
      this.logger.warn(
        "Classification returned null or empty title - generating fallback",
        {
          fileName,
          pathTokens,
          teamId,
          hasSummary: !!classificationResult.summary,
          hasDate: !!classificationResult.date,
          contentLength: content.length,
        },
      );

      // Generate fallback title from available metadata
      const fileNameWithoutExt =
        fileName
          .split("/")
          .pop()
          ?.replace(/\.[^/.]+$/, "") || "Document";
      const datePart = classificationResult.date
        ? ` - ${classificationResult.date}`
        : "";
      const summaryPart = classificationResult.summary
        ? ` - ${classificationResult.summary.substring(0, 50)}${classificationResult.summary.length > 50 ? "..." : ""}`
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
    // If classificationFailed, leave finalTitle as null - UI will show filename + retry option

    // Always update document - with AI results or null fallback
    // Document always reaches "completed" state so users can access the file
    const updatedDocs = await updateDocumentWithRetry(
      db,
      {
        pathTokens,
        teamId,
        title: finalTitle ?? undefined,
        summary: classificationResult?.summary ?? undefined,
        content: limitWords(content, 10000),
        date: classificationResult?.date ?? undefined,
        language: mapLanguageCodeToPostgresConfig(
          classificationResult?.language,
        ),
        // Always mark as completed - even if AI failed, document is usable
        processingStatus: "completed",
      },
      this.logger,
    );

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

    // Only trigger tag embedding if we have tags from successful classification
    if (classificationResult?.tags && classificationResult.tags.length > 0) {
      this.logger.info("Triggering document tag embedding", {
        documentId: data.id,
        tagsCount: classificationResult.tags.length,
      });

      // Trigger tag embedding (fire and forget)
      await triggerJob(
        "embed-document-tags",
        {
          documentId: data.id,
          tags: classificationResult.tags,
          teamId,
        },
        "documents",
        { jobId: `embed-tags_${teamId}_${data.id}` },
      );
    } else {
      this.logger.info("Document processing completed", {
        documentId: data.id,
        classificationFailed,
        hasTitle: !!finalTitle,
      });
    }
  }
}
