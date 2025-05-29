import { z } from "@hono/zod-openapi";

export const createDocumentTagSchema = z.object({
  name: z.string(),
});

export const deleteDocumentTagSchema = z.object({
  id: z.string(),
});
