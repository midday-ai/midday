import { z } from "zod";

export const getPolarOrdersSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().min(1).max(100).default(25),
});

export type GetPolarOrdersSchema = z.infer<typeof getPolarOrdersSchema>;
