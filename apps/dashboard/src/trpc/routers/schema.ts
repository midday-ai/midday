import { z } from "zod";

export const transactionsSchema = z.object({
  cursor: z.string().nullable().optional(),
  sort: z.array(z.string(), z.string()).nullable().optional(),
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
      amount_range: z.array(z.number()).nullable().optional(),
      amount: z.array(z.string()).nullable().optional(),
      type: z.enum(["income", "expense"]).nullable().optional(),
    })
    .optional(),
});
