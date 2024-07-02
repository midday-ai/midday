import { z } from "zod";

export const HealthSchema = z
  .object({
    plaid: z.object({
      healthy: z.boolean(),
    }),
    gocardless: z.object({
      healthy: z.boolean(),
    }),
    teller: z.object({
      healthy: z.boolean(),
    }),
  })
  .openapi("HealthSchema");
