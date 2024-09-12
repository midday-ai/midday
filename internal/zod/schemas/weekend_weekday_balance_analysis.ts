import { z } from "zod";

export const WeekendWeekdayBalanceAnalysisSchema = z.object({
  Month: z.number().int(),
  AccountId: z.string(),
  IsoCurrencyCode: z.string(),
  AvgWeekendBalance: z.number(),
  AvgWeekdayBalance: z.number(),
  UserId: z.string().uuid(),
  ProfileType: z.string(),
});
