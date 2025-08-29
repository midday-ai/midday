import type { NotificationHandler } from "../base";
import { documentUploadedSchema } from "../schemas";

export const documentUploaded: NotificationHandler = {
  schema: documentUploadedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "document_uploaded",
    source: "user",
    priority: 7,
    metadata: {
      fileName: data.fileName,
      filePath: data.filePath,
      mimeType: data.mimeType,
    },
  }),
};
