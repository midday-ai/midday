import { limitWords, mapLanguageCodeToPostgresConfig } from "@midday/documents";
import { DocumentClassifier } from "@midday/documents/classifier";
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { ClassifyImagePayload } from "../../schemas/documents";
import { getDb } from "../../utils/db";
import { updateDocumentWithRetry } from "../../utils/document-update";
import { NonRetryableError } from "../../utils/error-classification";
import { resizeImage } from "../../utils/image-processing";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

/**
 * Classification result type for graceful error handling
 */
interface ImageClassificationResult {
  title: string | null;
  summary: string | null;
  content: string | null;
  date: string | null;
  language: string | null;
  tags: string[] | null;
}

/**
 * Classify images using AI to extract metadata and tags
 * Uses graceful degradation - if AI fails, document is still marked completed
 * with null values so users can access the file and retry classification later
 */
export class ClassifyImageProcessor extends BaseProcessor<ClassifyImagePayload> {
  async process(job: Job<ClassifyImagePayload>): Promise<void> {
    const { teamId, fileName } = job.data;
    const supabase = createClient();
    const db = getDb();

    // fileName is the full path (e.g., "teamId/filename.jpg")
    // We need to split it into pathTokens for updateDocumentByPath
    const pathTokens = fileName.split("/");

    this.logger.info("Classifying image", {
      fileName,
      teamId,
    });

    // Download file - this is a hard failure if it fails (file doesn't exist)
    const { data: fileData } = await withTimeout(
      supabase.storage.from("vault").download(fileName),
      TIMEOUTS.FILE_DOWNLOAD,
      `File download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
    );

    if (!fileData) {
      throw new NonRetryableError("File not found", undefined, "validation");
    }

    const rawImageContent = await fileData.arrayBuffer();

    // Resize image for optimal AI processing (2048px max dimension)
    // This improves processing speed and reduces token costs while maintaining OCR quality
    const { buffer: imageContent } = await resizeImage(
      rawImageContent,
      fileData.type || "image/jpeg",
      this.logger,
    );

    // Attempt AI classification with graceful fallback
    let classificationResult: ImageClassificationResult | null = null;
    let classificationFailed = false;

    try {
      const classifier = new DocumentClassifier();
      // Convert Buffer to ArrayBuffer for classifier
      const arrayBuffer = new Uint8Array(imageContent).buffer;
      classificationResult = await withTimeout(
        classifier.classifyImage({ content: arrayBuffer }),
        TIMEOUTS.AI_CLASSIFICATION,
        `Image classification timed out after ${TIMEOUTS.AI_CLASSIFICATION}ms`,
      );
    } catch (error) {
      // Log error but don't fail - we'll complete with fallback
      classificationFailed = true;
      this.logger.warn(
        "AI image classification failed, completing with fallback",
        {
          fileName,
          teamId,
          error: error instanceof Error ? error.message : "Unknown error",
          errorType: error instanceof Error ? error.name : "Unknown",
        },
      );
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
        "Image classification returned null or empty title - generating fallback",
        {
          fileName,
          pathTokens,
          teamId,
          hasSummary: !!classificationResult.summary,
          hasDate: !!classificationResult.date,
          hasContent: !!classificationResult.content,
        },
      );

      // Generate fallback title from available metadata
      const fileNameWithoutExt =
        fileName
          .split("/")
          .pop()
          ?.replace(/\.[^/.]+$/, "") || "Image";
      const datePart = classificationResult.date
        ? ` - ${classificationResult.date}`
        : "";
      const summaryPart = classificationResult.summary
        ? ` - ${classificationResult.summary.substring(0, 50)}${classificationResult.summary.length > 50 ? "..." : ""}`
        : "";

      // Try to infer type from summary or content
      const contentSample = (
        classificationResult.content ||
        classificationResult.summary ||
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
        content: classificationResult?.content
          ? limitWords(classificationResult.content, 10000)
          : undefined,
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

    // Only trigger tag embedding if we have tags from successful classification
    if (classificationResult?.tags && classificationResult.tags.length > 0) {
      this.logger.info("Triggering document tag embedding", {
        documentId: data.id,
        tagsCount: classificationResult.tags.length,
      });

      await triggerJob(
        "embed-document-tags",
        { documentId: data.id, tags: classificationResult.tags, teamId },
        "documents",
        { jobId: `embed-tags_${teamId}_${data.id}` },
      );
    } else {
      this.logger.info("Image processing completed", {
        documentId: data.id,
        classificationFailed,
        hasTitle: !!finalTitle,
      });
    }
  }
}
