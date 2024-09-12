import { z } from "zod";

export const AvgTransactionAmountByCategorySchema = z.object({
  Category: z.string(),
  AvgAmount: z.number().nonnegative(),
  UserId: z.string().uuid(),
});
