import { DocumentClassifier } from "@midday/documents/classifier";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { embedDocumentTags } from "./embed-document-tags";

export const classifyImage = schemaTask({
  id: "classify-image",
  schema: z.object({
    file_path: z.array(z.string()),
  }),
  run: async ({ file_path }) => {
    const supabase = createClient();
    const classifier = new DocumentClassifier();

    const { data: fileData } = await supabase.storage
      .from("vault")
      .download(file_path.join("/"));

    if (!fileData) {
      throw new Error("File not found");
    }

    const content = await fileData.arrayBuffer();

    const result = await classifier.classifyImage({ content });

    console.log(result);

    // const { data, error } = await supabase
    //   .from("documents")
    //   .update({
    //     title: result.title,
    //     summary: result.summary,
    //     content,
    //     date: result.date,
    //   })
    //   .eq("name", fileName)
    //   .select()
    //   .single();

    // if (error) {
    //   throw new Error(error.message);
    // }

    // if (result.tags && result.tags.length > 0) {
    //   await embedDocumentTags.trigger({
    //     documentId: data.id,
    //     tags: result.tags,
    //   });
    // }

    // return result;
  },
});
