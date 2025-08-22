import { z } from "@hono/zod-openapi";

export const connectInboxAccountSchema = z.object({
  provider: z.enum(["gmail"]),
});

export const exchangeCodeForAccountSchema = z.object({
  code: z.string(),
  provider: z.enum(["gmail"]),
});

export const deleteInboxAccountSchema = z.object({ id: z.string() });

export const syncInboxAccountSchema = z.object({
  id: z.string(),
  manualSync: z.boolean().optional(),
});
