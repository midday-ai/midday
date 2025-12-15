import { z } from "zod";

export const searchParamsSchema = z.object({
  event: z.literal("app_oauth_completed"),
  provider: z.enum(["dropbox", "googledrive"]).optional(),
  connectionId: z.string().optional(),
});

export type WindowEvent = z.infer<typeof searchParamsSchema>["event"];
