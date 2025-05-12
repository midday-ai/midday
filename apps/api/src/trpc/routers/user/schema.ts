import { z } from "zod";

export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(32).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
  locale: z.string().optional(),
  week_starts_on_monday: z.boolean().optional(),
  timezone: z.string().optional(),
  time_format: z.number().optional(),
  date_format: z
    .enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"])
    .optional(),
});
