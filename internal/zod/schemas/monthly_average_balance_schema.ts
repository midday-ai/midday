import { z } from "zod";

export const MonthlyAverageBalanceSchema = z.object({
  Month: z.number().int(),
  AccountId: z.string(),
  IsoCurrencyCode: z.string(),
  AverageBalance: z.number(),
  UserId: z.string().uuid(),
  ProfileType: z.string(),
});
