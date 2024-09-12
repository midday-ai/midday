import { z } from "zod";

export const IncomeConcentrationSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  ConcentrationRatio: z.number().min(0).max(1),
  UserId: z.string().uuid(),
});
