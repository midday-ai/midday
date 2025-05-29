import { z } from "@hono/zod-openapi";

export const createDocumentTagAssignmentSchema = z.object({
  documentId: z.string(),
  tagId: z.string(),
});

export const deleteDocumentTagAssignmentSchema = z.object({
  documentId: z.string(),
  tagId: z.string(),
});
