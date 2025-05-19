import { z } from "zod";

export const createTransactionTagSchema = z.object({
  transactionId: z.string(),
  tagId: z.string(),
});

export const deleteTransactionTagSchema = z.object({
  transactionId: z.string(),
  tagId: z.string(),
});
