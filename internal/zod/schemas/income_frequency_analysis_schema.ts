import { z } from "zod";

export const IncomeFrequencyAnalysisSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  Source: z.string(),
  AvgDaysBetweenTransactions: z.number().nonnegative(),
  UserId: z.string().uuid(),
});
