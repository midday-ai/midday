import { z } from "zod";

export const IncomeByTimeOfDaySchema = z.object({
  HourOfDay: z.number().int().min(0).max(23),
  TotalIncome: z.number().nonnegative(),
  TransactionCount: z.number().int().nonnegative(),
  UserId: z.string().uuid(),
});
