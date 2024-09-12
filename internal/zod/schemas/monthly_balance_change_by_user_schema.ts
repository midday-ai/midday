import { z } from "zod";

export const MonthlyBalanceChangeByUserSchema = z.object({
  Month: z.number().int(),
  UserId: z.string().uuid(),
  BalanceChange: z.number(),
  ProfileType: z.string(),
});
