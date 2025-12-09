import { z } from "zod";

/**
 * Document job schemas (independent from @midday/jobs)
 */

export const processDocumentSchema = z.object({
  mimetype: z.string(),
  filePath: z.array(z.string()),
  teamId: z.string().uuid(),
});

export type ProcessDocumentPayload = z.infer<typeof processDocumentSchema>;

export const classifyImageSchema = z.object({
  teamId: z.string().uuid(),
  fileName: z.string(),
});

export type ClassifyImagePayload = z.infer<typeof classifyImageSchema>;

export const classifyDocumentSchema = z.object({
  content: z.string(),
  fileName: z.string(),
  teamId: z.string().uuid(),
});

export type ClassifyDocumentPayload = z.infer<typeof classifyDocumentSchema>;

export const embedDocumentTagsSchema = z.object({
  documentId: z.string().uuid(),
  teamId: z.string().uuid(),
  tags: z.array(z.string()).min(1),
});

export type EmbedDocumentTagsPayload = z.infer<typeof embedDocumentTagsSchema>;
