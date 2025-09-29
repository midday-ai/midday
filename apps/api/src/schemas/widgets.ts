import { z } from "zod";

export const getRunwaySchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
});
