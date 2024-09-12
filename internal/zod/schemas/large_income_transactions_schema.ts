import { z } from "zod";

export const LargeIncomeTransactionsSchema = z.object({
  Time: z.date(),
  Amount: z.number().min(1000),
  Source: z.string(),
  Category: z.string(),
  UserId: z.string().uuid(),
});
