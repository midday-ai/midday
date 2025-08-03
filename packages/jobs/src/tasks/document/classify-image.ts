import { getDb } from "@jobs/init";
import { updateDocumentByFileName } from "@midday/db/queries";
import { limitWords } from "@midday/documents";
import { DocumentClassifier } from "@midday/documents/classifier";
import { createClient } from "@midday/supabase/job";
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
    const supabase = createClient();
    const classifier = new DocumentClassifier();

    const { data: fileData } = await supabase.storage
      .from("vault")
      .download(fileName);

    if (!fileData) {
      throw new Error("File not found");
    }

    const content = await fileData.arrayBuffer();

    const result = await classifier.classifyImage({ content });

    const data = await updateDocumentByFileName(getDb(), {
      fileName,
      teamId,
      title: result.title,
      summary: result.summary,
      content: result.content ? limitWords(result.content, 10000) : undefined,
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
