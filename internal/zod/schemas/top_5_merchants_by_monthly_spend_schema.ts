import { z } from "zod";

export const Top5MerchantsByMonthlySpendSchema = z.object({
  Month: z.number().int(),
  MerchantName: z.string(),
  TotalSpend: z.number(),
  UserId: z.string().uuid(),
});
