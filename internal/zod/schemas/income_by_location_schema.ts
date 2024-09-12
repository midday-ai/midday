import { z } from "zod";

export const IncomeByLocationSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  City: z.string(),
  Region: z.string(),
  Country: z.string(),
  TotalIncome: z.number().nonnegative(),
  UserId: z.string().uuid(),
});
