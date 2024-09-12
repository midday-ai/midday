import { z } from "zod";

export const BalancePercentileAnalysisSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  AccountId: z.string(),
  IsoCurrencyCode: z.string(),
  Q1Balance: z.number(),
  MedianBalance: z.number(),
  Q3Balance: z.number(),
  UserId: z.string().uuid(),
  ProfileType: z.string(),
});
