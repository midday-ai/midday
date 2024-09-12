import { z } from "zod";

export const BalanceTrendAnalysisSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  AccountId: z.string(),
  IsoCurrencyCode: z.string(),
  MinBalance: z.number(),
  MaxBalance: z.number(),
  AvgBalance: z.number(),
  StartBalance: z.number(),
  EndBalance: z.number(),
  UserId: z.string().uuid(),
  ProfileType: z.string(),
});
