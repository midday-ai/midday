import { z } from "zod";

export const BalanceGrowthRateAnalysisSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  AccountId: z.string(),
  IsoCurrencyCode: z.string(),
  GrowthRate: z.number(),
  UserId: z.string().uuid(),
  ProfileType: z.string(),
});
