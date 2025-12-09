import { getDb } from "@jobs/init";
import { updateDocumentByFileName } from "@midday/db/queries";
import { limitWords, mapLanguageCodeToPostgresConfig } from "@midday/documents";
import { DocumentClassifier } from "@midday/documents/classifier";
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { embedDocumentTags } from "./embed-document-tags";

export const classifyDocument = schemaTask({
  id: "classify-document",
  schema: z.object({
    content: z.string(),
    fileName: z.string(),
    teamId: z.string(),
  }),
  run: async ({ content, fileName, teamId }) => {
    try {
      const classifier = new DocumentClassifier();
      const result = await classifier.classifyDocument({ content });

      // Validate title extraction - log if null and generate fallback
      let finalTitle = result.title;
      if (!finalTitle || finalTitle.trim().length === 0) {
        console.warn(
          `Classification returned null or empty title for ${fileName} - generating fallback`,
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
        if (
          contentSample.includes("invoice") ||
          contentSample.includes("inv")
        ) {
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

        console.info(`Generated fallback title: ${finalTitle}`);
      }

      const data = await updateDocumentByFileName(getDb(), {
        fileName,
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

      if (!data) {
        throw new Error(`Document with fileName ${fileName} not found`);
      }

      if (result.tags && result.tags.length > 0) {
        await embedDocumentTags.trigger({
          documentId: data.id,
          tags: result.tags,
          teamId,
        });
      }

      return result;
    } catch (error) {
      // Update document status to failed on error
      try {
        await updateDocumentByFileName(getDb(), {
          fileName,
          teamId,
          processingStatus: "failed",
        });
      } catch (updateError) {
        // Log but don't fail if we can't update the status
        console.error(
          "Failed to update document status to failed:",
          updateError,
        );
      }

      // Re-throw the original error
      throw error;
    }
  },
});
