import { z } from "zod";

export const searchParamsSchema = z.object({
  status: z.enum(["success", "error"]),
  error: z.string().optional(),
});

export type OAuthStatus = z.infer<typeof searchParamsSchema>["status"];
