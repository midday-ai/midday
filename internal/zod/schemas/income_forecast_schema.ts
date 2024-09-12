import { z } from "zod";

export const IncomeForecastSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  ForecastedIncome: z.number().nonnegative(),
  UserId: z.string().uuid(),
});
