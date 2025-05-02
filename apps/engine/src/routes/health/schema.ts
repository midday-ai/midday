import { z } from "@hono/zod-openapi";

export const HealthSchema = z
  .object({
    data: z.object({
      plaid: z.object({
        healthy: z.boolean(),
      }),
      gocardless: z.object({
        healthy: z.boolean(),
      }),
      teller: z.object({
        healthy: z.boolean(),
      }),
      search: z.object({
        healthy: z.boolean(),
      }),
    }),
  })
  .openapi("HealthSchema");
