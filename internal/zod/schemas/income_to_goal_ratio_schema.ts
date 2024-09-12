import { z } from "zod";

export const DailyBalanceSnapshotSchema = z.object({
  Date: z.date(),
  AccountId: z.string(),
  IsoCurrencyCode: z.string(),
  EndOfDayBalance: z.number(),
  UserId: z.string().uuid(),
  ProfileType: z.string(),
});
