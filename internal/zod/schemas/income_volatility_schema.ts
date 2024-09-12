import { z } from "zod";

export const IncomeVolatilitySchema = z.object({
  Month: z.number().int(),
  Volatility: z.number(),
  UserId: z.string().uuid(),
});
