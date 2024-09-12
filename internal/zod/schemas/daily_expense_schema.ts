import { z } from "zod";

export const DailyExpenseTrendSchema = z.object({
  Date: z.date(),
  DailyExpense: z.number().nonnegative(),
  UserId: z.string().uuid(),
});
