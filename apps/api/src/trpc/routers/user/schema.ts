import { z } from "zod";

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(32).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  locale: z.string().optional(),
  weekStartsOnMonday: z.boolean().optional(),
  timezone: z.string().optional(),
  timeFormat: z.number().optional(),
  dateFormat: z
    .enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"])
    .optional(),
});
