import { getDb } from "@jobs/init";
import { updateDocumentByFileName } from "@midday/db/queries";
import { limitWords } from "@midday/documents";
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
    const classifier = new DocumentClassifier();
    const result = await classifier.classifyDocument({ content });

    const data = await updateDocumentByFileName(getDb(), {
      fileName,
      teamId,
      title: result.title,
      summary: result.summary,
      content: limitWords(content, 10000),
      date: result.date,
      language: result.language,
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
  },
});
