import { z } from "zod";

export const ExpenseFrequencyByCategorySchema = z.object({
  Category: z.string(),
  TransactionCount: z.number().int().nonnegative(),
  UserId: z.string().uuid(),
});
