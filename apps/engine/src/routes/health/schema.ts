import { z } from "zod";

export const HealthSchema = z
  .object({
    plaid: z.object({
      health: z.boolean(),
    }),
    gocardless: z.object({
      health: z.boolean(),
    }),
    teller: z.object({
      health: z.boolean(),
    }),
  })
  .openapi("HealthSchema");
