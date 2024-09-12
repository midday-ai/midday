import { z } from "zod";

export const IncomeByDayOfWeekSchema = z.object({
  DayOfWeek: z.number().int().min(1).max(7),
  TotalIncome: z.number().nonnegative(),
  TransactionCount: z.number().int().nonnegative(),
  UserId: z.string().uuid(),
});
