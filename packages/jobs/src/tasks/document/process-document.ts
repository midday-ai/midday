import { loadDocument } from "@midday/documents/loader";
import { getContentSample } from "@midday/documents/utils";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { classifyDocument } from "./classify-document";
import { classifyImage } from "./classify-image";
import { convertHeic } from "./convert-heic";

// NOTE: Process documents and images for classification
export const processDocument = schemaTask({
  id: "process-document",
  schema: z.object({
    mimetype: z.string(),
    filePath: z.array(z.string()),
    teamId: z.string(),
  }),
  maxDuration: 60,
  queue: {
    concurrencyLimit: 100,
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
        fileName: filePath.join("/"),
        teamId,
      });
    } catch (error) {
      console.error(error);

      await supabase
        .from("documents")
        .update({
          processing_status: "failed",
        })
        .eq("id", filePath.join("/"));
    }
  },
});
