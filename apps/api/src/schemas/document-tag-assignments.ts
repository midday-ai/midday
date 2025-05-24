import { z } from "zod";

export const createDocumentTagAssignmentSchema = z.object({
  documentId: z.string(),
  tagId: z.string(),
});

export const deleteDocumentTagAssignmentSchema = z.object({
  documentId: z.string(),
  tagId: z.string(),
});
