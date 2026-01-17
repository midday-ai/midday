import { z } from "@hono/zod-openapi";

export const createAttachmentsSchema = z.array(
  z.object({
    path: z.array(z.string()),
    name: z.string(),
    size: z.number(),
    transactionId: z.string().uuid(),
    type: z.string(),
  }),
);

export const deleteAttachmentSchema = z.object({ id: z.string().uuid() });

export const processTransactionAttachmentSchema = z.array(
  z.object({
    transactionId: z.string().uuid(),
    mimetype: z.string(),
    filePath: z.array(z.string()),
  }),
);
