import { z } from "zod";

export const IncomeDiversityAnalysisSchema = z.object({
  Month: z.number().int().min(202201).max(209912),
  DistinctSources: z.number().int().positive(),
  UserId: z.string().uuid(),
});
