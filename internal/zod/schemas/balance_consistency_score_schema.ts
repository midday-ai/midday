import { z } from "zod";

export const BalanceConsistencyScoreSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  AccountId: z.string(),
  IsoCurrencyCode: z.string(),
  ConsistencyScore: z.number().min(0).max(1),
  UserId: z.string().uuid(),
  ProfileType: z.string(),
});
