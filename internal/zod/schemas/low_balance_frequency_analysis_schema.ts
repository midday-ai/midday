import { z } from "zod";

export const LowBalanceFrequencyAnalysisSchema = z.object({
  Month: z.number().int(),
  AccountId: z.string(),
  IsoCurrencyCode: z.string(),
  LowBalanceCount: z.number().int(),
  TotalBalanceRecords: z.number().int(),
  LowBalanceFrequency: z.number(),
  UserId: z.string().uuid(),
  ProfileType: z.string(),
});
