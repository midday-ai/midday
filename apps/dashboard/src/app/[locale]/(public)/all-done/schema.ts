import { z } from "zod";

export const searchParamsSchema = z.object({
  event: z.literal("app_oauth_completed"),
});

export type WindowEvent = z.infer<typeof searchParamsSchema>["event"];
