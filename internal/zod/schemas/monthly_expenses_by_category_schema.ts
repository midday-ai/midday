import { z } from "zod";

export const MonthlyExpensesByCategorySchema = z.object({
  Month: z.number().int(),
  Category: z.string(),
  TotalExpense: z.number(),
  UserId: z.string().uuid(),
});
