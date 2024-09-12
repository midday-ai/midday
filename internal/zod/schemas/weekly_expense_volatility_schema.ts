import { z } from "zod";

// WeeklyExpenseVolatility
export const WeeklyExpenseVolatilitySchema = z.object({
  Month: z.number().int(),
  WeekStart: z.date(),
  ExpenseVolatility: z.number(),
  UserId: z.string().uuid(),
});
