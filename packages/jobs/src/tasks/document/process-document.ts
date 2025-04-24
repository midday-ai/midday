import { loadDocument } from "@midday/documents/loader";
import { getContentSample } from "@midday/documents/utils";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { classifyDocument } from "./classify-document";
import { classifyImage } from "./classify-image";

// NOTE: Process documents and images for classification
export const processDocument = schemaTask({
  id: "process-document",
  schema: z.object({
    mimetype: z.string(),
    file_path: z.array(z.string()),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 100,
  },
  run: async ({ mimetype, file_path }) => {
    const supabase = createClient();

    // If the file is an image, we have a special classifier for it
    // NOTE: We don't want to classify images in the inbox (we have a special classifier for that)
    if (mimetype.startsWith("image/") && !file_path.includes("inbox")) {
      await classifyImage.trigger({
        file_path,
      });

      return;
    }

    const { data: fileData } = await supabase.storage
      .from("vault")
      .download(file_path.join("/"));

    if (!fileData) {
      throw new Error("File not found");
    }

    const document = await loadDocument({
      content: fileData,
      metadata: { mimetype },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    const sample = getContentSample(document);

    await classifyDocument.trigger({
      content: sample,
      fileName: file_path.join("/"),
    });
  },
});
