import { z } from "zod";

export const globalSearchSchema = z.object({
  searchTerm: z.string().optional(),
  language: z.string().optional(),
  limit: z.number().default(30),
  itemsPerTableLimit: z.number().default(5),
  relevanceThreshold: z.number().default(0.01),
});
