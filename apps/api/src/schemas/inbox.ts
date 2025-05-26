import { z } from "@hono/zod-openapi";

export const getInboxSchema = z
  .object({
    cursor: z.string().nullable().optional(),
    order: z.string().nullable().optional(),
    pageSize: z.number().min(1).max(100).optional(),
    filter: z
      .object({
        q: z.string().nullable().optional(),
        status: z.enum(["done", "pending"]).nullable().optional(),
      })
      .optional(),
  })
  .optional();

export const getInboxByIdSchema = z.object({ id: z.string() });

export const deleteInboxSchema = z.object({ id: z.string() });

export const processAttachmentsSchema = z.array(
  z.object({
    mimetype: z.string(),
    size: z.number(),
    filePath: z.array(z.string()),
  }),
);

export const searchInboxSchema = z.object({
  query: z.string(),
  limit: z.number().optional(),
});

export const updateInboxSchema = z.object({
  id: z.string(),
  status: z.enum(["new", "archived", "processing", "done", "pending"]),
});

export const matchTransactionSchema = z.object({
  id: z.string(),
  transactionId: z.string().uuid(),
});

export const unmatchTransactionSchema = z.object({
  id: z.string().uuid(),
});
