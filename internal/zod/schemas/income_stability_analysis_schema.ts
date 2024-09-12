import { z } from "zod";

export const IncomeStabilityAnalysisSchema = z.object({
  Month: z.number().int(),
  CoefficientOfVariation: z.number(),
  UserId: z.string().uuid(),
});
