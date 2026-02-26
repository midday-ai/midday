import { processTransactionAttachmentSchema } from "@jobs/schema";
import { schemaTask } from "@trigger.dev/sdk";
import { convertHeic } from "../document/convert-heic";
import { processDocument } from "../document/process-document";

export const processTransactionAttachment = schemaTask({
  id: "process-transaction-attachment",
  schema: processTransactionAttachmentSchema,
  maxDuration: 60,
  queue: {
    concurrencyLimit: 100,
  },
  run: async ({ mimetype, filePath, teamId }) => {
    // If the file is a HEIC we need to convert it to a JPG
    if (mimetype === "image/heic") {
      await convertHeic.triggerAndWait({
        filePath,
      });
    }

    // NOTE: Process documents and images for classification
    await processDocument.trigger({
      mimetype,
      filePath,
      teamId,
    });
  },
});
