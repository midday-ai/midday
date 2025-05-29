import { z } from "@hono/zod-openapi";

export const createTransactionTagSchema = z.object({
  transactionId: z.string(),
  tagId: z.string(),
});

export const deleteTransactionTagSchema = z.object({
  transactionId: z.string(),
  tagId: z.string(),
});
