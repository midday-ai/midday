import { z } from "@hono/zod-openapi";

export const HealthCheckResponseSchema = z.object({
  healthy: z.boolean(),
  message: z.string().optional(),
}).openapi("HealthCheckResponse");

export const HealthSchema = z.object({
  data: z.object({
    search: z.object({ healthy: z.boolean() }),
    teller: HealthCheckResponseSchema,
    gocardless: HealthCheckResponseSchema,
    plaid: HealthCheckResponseSchema,
  }),
}).openapi("HealthSchema");
