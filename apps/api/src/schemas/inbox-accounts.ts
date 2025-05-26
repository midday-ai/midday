import { z } from "@hono/zod-openapi";

export const connectInboxAccountSchema = z.object({
  provider: z.enum(["gmail", "outlook"]),
});

export const deleteInboxAccountSchema = z.object({ id: z.string() });
