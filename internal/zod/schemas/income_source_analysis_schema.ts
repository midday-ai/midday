import { z } from "zod";

export const IncomeSourceAnalysisSchema = z.object({
  Month: z.number().int().min(201001).max(209912),
  Source: z.string(),
  TotalIncome: z.number().nonnegative(),
  TransactionCount: z.number().int().nonnegative(),
  UserId: z.string().uuid(),
});
