import { z } from "zod";

export const IncomeToGoalRatioSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  IncomeToGoalRatio: z.number().nonnegative(),
  UserId: z.string().uuid(),
});
