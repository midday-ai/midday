import type { NotificationHandler } from "../base";
import { documentProcessedSchema } from "../schemas";

export const documentProcessed: NotificationHandler = {
  schema: documentProcessedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    type: "document_processed",
    source: "system",
    priority: 7,
    metadata: {
      fileName: data.fileName,
      filePath: data.filePath,
      mimeType: data.mimeType,
      ...(data.contentLength && { contentLength: data.contentLength }),
      ...(data.sampleLength && { sampleLength: data.sampleLength }),
      ...(data.isImage && { isImage: data.isImage }),
    },
  }),
};
