import { z } from "zod";

export const MonthlyIncomeByCategorySchema = z.object({
  Month: z.number().int(),
  Category: z.string(),
  TotalIncome: z.number(),
  UserId: z.string().uuid(),
});
