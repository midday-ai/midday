import { z } from "zod";

export const featureRequestSchema = z.object({
  email: z.string().email(),
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  category: z.string(),
});

export const sendSupportSchema = z.object({
  email: z.string().email(),
  fullName: z.string(),
  subject: z.string(),
  priority: z.string(),
  type: z.string(),
  message: z.string(),
});
