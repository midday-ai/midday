import { z } from "zod";

export const IncomeExpenseRatioSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  IncomeExpenseRatio: z.number().nonnegative(),
  UserId: z.string().uuid(),
});
