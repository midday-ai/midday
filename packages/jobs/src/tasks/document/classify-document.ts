import { DocumentClassifier } from "@midday/documents/classifier";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
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
    const supabase = createClient();
    const classifier = new DocumentClassifier();
    const result = await classifier.classifyDocument({ content });

    const { data, error } = await supabase
      .from("documents")
      .update({
        title: result.title,
        summary: result.summary,
        content,
        date: result.date,
        language: result.language,
        // If the document has no tags, we consider it as processed
        processing_status:
          !result.tags || result.tags.length === 0 ? "completed" : undefined,
      })
      .eq("name", fileName)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
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
