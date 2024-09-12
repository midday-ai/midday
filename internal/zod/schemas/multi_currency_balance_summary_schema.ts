import { z } from "zod";

export const MultiCurrencyBalanceSummarySchema = z.object({
  Month: z.number().int(),
  UserId: z.string().uuid(),
  ProfileType: z.string(),
  AccountIds: z.array(z.string()),
  Currencies: z.array(z.string()),
  AvgBalances: z.array(z.number()),
});
