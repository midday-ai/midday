import { z } from "@hono/zod-openapi";

export const disconnectAppSchema = z.object({
  appId: z.string(),
});

export const updateAppSettingsSchema = z.object({
  appId: z.string(),
  option: z.object({
    id: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
  }),
});
