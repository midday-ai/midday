import { z } from "zod";

export const BalanceVolatilityAnalysisSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  AccountId: z.string(),
  IsoCurrencyCode: z.string(),
  BalanceVolatility: z.number().nonnegative(),
  UserId: z.string().uuid(),
  ProfileType: z.string(),
});
