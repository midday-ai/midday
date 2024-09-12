import { z } from "zod";

export const IncomeTrendAnalysisSchema = z.object({
  Month: z.number().int(),
  TotalIncome: z.number(),
  AvgIncome: z.number(),
  MaxIncome: z.number(),
  MinIncome: z.number(),
  UserId: z.string().uuid(),
});
