import type { Scope } from "@api/utils/scopes";
import { SCOPES } from "@api/utils/scopes";
import { z } from "@hono/zod-openapi";

export const upsertApiKeySchema = z.object({
  id: z.string().optional(),
  name: z.string().openapi({
    description: "The name of the API key",
    example: "API Key 1",
  }),
  scopes: z.array(z.enum(SCOPES)).openapi({
    description: "The scopes of the API key",
    example: ["bank-accounts.read", "bank-accounts.write"],
  }),
});

export const deleteApiKeySchema = z.object({
  id: z.string().openapi({
    description: "The ID of the API key",
    example: "123",
  }),
});
