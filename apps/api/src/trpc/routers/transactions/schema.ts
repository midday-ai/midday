import { z } from "zod";

export const getTransactionsSchema = z.object({
  cursor: z.string().nullable().optional(),
  sort: z.array(z.string(), z.string()).nullable().optional(),
  pageSize: z.number().optional(),
  filter: z
    .object({
      q: z.string().nullable().optional(),
      categories: z.array(z.string()).nullable().optional(),
      tags: z.array(z.string()).nullable().optional(),
      start: z.string().nullable().optional(),
      end: z.string().nullable().optional(),
      accounts: z.array(z.string()).nullable().optional(),
      assignees: z.array(z.string()).nullable().optional(),
      statuses: z.array(z.string()).nullable().optional(),
      recurring: z.array(z.string()).nullable().optional(),
      attachments: z.enum(["include", "exclude"]).nullable().optional(),
      amountRange: z.array(z.number()).nullable().optional(),
      amount: z.array(z.string()).nullable().optional(),
      type: z.enum(["income", "expense"]).nullable().optional(),
    })
    .optional(),
});

export const deleteTransactionsSchema = z.object({
  ids: z.array(z.string()),
});

export const getTransactionByIdSchema = z.object({
  id: z.string().uuid(),
});

export const updateTransactionSchema = z.object({
  id: z.string().uuid(),
  categorySlug: z.string().nullable().optional(),
  status: z
    .enum(["pending", "archived", "completed", "posted", "excluded"])
    .nullable()
    .optional(),
  internal: z.boolean().optional(),
  recurring: z.boolean().optional(),
  frequency: z
    .enum(["weekly", "monthly", "annually", "irregular"])
    .nullable()
    .optional(),
  note: z.string().nullable().optional(),
  assignedId: z.string().nullable().optional(),
});

export const updateTransactionsSchema = z.object({
  ids: z.array(z.string()),
  categorySlug: z.string().nullable().optional(),
  status: z
    .enum(["pending", "archived", "completed", "posted", "excluded"])
    .nullable()
    .optional(),
  frequency: z
    .enum(["weekly", "monthly", "annually", "irregular"])
    .nullable()
    .optional(),
  internal: z.boolean().optional(),
  note: z.string().nullable().optional(),
  assignedId: z.string().nullable().optional(),
  recurring: z.boolean().optional(),
  tagId: z.string().nullable().optional(),
});

export const getSimilarTransactionsSchema = z.object({
  name: z.string(),
  categorySlug: z.string().optional(),
  frequency: z.enum(["weekly", "monthly", "annually", "irregular"]).optional(),
});

export const updateSimilarTransactionsCategorySchema = z.object({
  name: z.string(),
  categorySlug: z.string().optional(),
  frequency: z.enum(["weekly", "monthly", "annually", "irregular"]).optional(),
  recurring: z.boolean().optional(),
});

export const updateSimilarTransactionsRecurringSchema = z.object({
  id: z.string().uuid(),
});

export const searchTransactionMatchSchema = z.object({
  query: z.string().optional(),
  inboxId: z.string().uuid().optional(),
  maxResults: z.number().optional(),
  minConfidenceScore: z.number().optional(),
});

export const createTransactionSchema = z.object({
  name: z.string(),
  amount: z.number(),
  currency: z.string(),
  date: z.string(),
  bankAccountId: z.string(),
  assignedId: z.string().optional(),
  categorySlug: z.string().optional(),
  note: z.string().optional(),
  internal: z.boolean().optional(),
  attachments: z
    .array(
      z.object({
        path: z.array(z.string()),
        name: z.string(),
        size: z.number(),
        type: z.string(),
      }),
    )
    .optional(),
});
