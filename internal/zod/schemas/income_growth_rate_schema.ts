import { z } from "zod";

export const IncomeGrowthRateSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  GrowthRate: z.number(),
  UserId: z.string().uuid(),
});
