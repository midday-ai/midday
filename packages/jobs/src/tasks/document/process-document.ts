import { getDb } from "@jobs/init";
import { processDocumentSchema } from "@jobs/schema";
import { convertToMarkdown } from "@jobs/utils/convert-to-markdown";
import { updateDocumentByPath } from "@midday/db/queries";
import { getContentSample } from "@midday/documents/utils";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk";
import { classifyDocument } from "./classify-document";
import { classifyImage } from "./classify-image";
import { convertHeic } from "./convert-heic";

// NOTE: Process documents and images for classification
export const processDocument = schemaTask({
  id: "process-document",
  schema: processDocumentSchema,
  maxDuration: 60,
  queue: {
    concurrencyLimit: 50,
  },
  run: async ({ mimetype, filePath, teamId }) => {
    const supabase = createClient();

    try {
      // If the file is a HEIC we need to convert it to a JPG
      if (mimetype === "image/heic") {
        await convertHeic.triggerAndWait({
          filePath,
        });
      }

      // If the file is an image, we have a special classifier for it
      if (mimetype.startsWith("image/")) {
        await classifyImage.trigger({
          fileName: filePath.join("/"),
          teamId,
        });

        return;
      }

      const { data: fileData } = await supabase.storage
        .from("vault")
        .download(filePath.join("/"));

      if (!fileData) {
        throw new Error("File not found");
      }

      const document = await convertToMarkdown(fileData, filePath.join("/"));

      if (!document) {
        throw new Error("Document conversion failed");
      }

      const sample = getContentSample(document);

      await classifyDocument.trigger({
        content: sample,
        fileName: filePath.join("/"),
        teamId,
      });
    } catch (error) {
      console.error(error);

      await updateDocumentByPath(getDb(), {
        pathTokens: filePath,
        teamId,
        processingStatus: "failed",
      });
    }
  },
});
