import { z } from "zod";

export const IncomeSeasonalityAnalysisSchema = z.object({
  Month: z.number().int().min(1).max(12),
  AvgMonthlyIncome: z.number(),
  UserId: z.string().uuid(),
});
