import { getDb } from "@jobs/init";
import { updateDocumentByFileName } from "@midday/db/queries";
import { limitWords, mapLanguageCodeToPostgresConfig } from "@midday/documents";
import { DocumentClassifier } from "@midday/documents/classifier";
import { download } from "@midday/storage";
import { assertTeamKey } from "@midday/storage/keys";
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { embedDocumentTags } from "./embed-document-tags";

export const classifyImage = schemaTask({
  id: "classify-image",
  schema: z.object({
    teamId: z.string(),
    fileName: z.string(),
  }),
  run: async ({ teamId, fileName }) => {
    try {
      const classifier = new DocumentClassifier();

      const fileData = await download("vault", assertTeamKey(teamId, fileName));

      if (!fileData) {
        throw new Error("File not found");
      }

      const content = await fileData.arrayBuffer();

      const result = await classifier.classifyImage({ content });

      const data = await updateDocumentByFileName(getDb(), {
        fileName,
        teamId,
        title: result.title ?? undefined,
        summary: result.summary ?? undefined,
        content: result.content ? limitWords(result.content, 10000) : undefined,
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
