import { z } from "zod";

export const LargeIncomeTransactionsSchema = z.object({
  Time: z.date(),
  Amount: z.number(),
  Source: z.string(),
  Category: z.string(),
  UserId: z.string().uuid(),
});
