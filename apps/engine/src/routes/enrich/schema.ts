import { z } from "@hono/zod-openapi";

export const EnrichBodySchema = z.object({
  data: z
    .array(
      z.object({
        id: z.string().openapi("The id of the transaction"),
        date: z.coerce.date().openapi("The date of the transaction"),
        description: z.string().openapi("The description of the transaction"),
        currency: z.string().openapi("The currency of the transaction"),
        amount: z.number().openapi("The amount of the transaction"),
        category: z
          .string()
          .optional()
          .openapi("The category of the transaction"),
      }),
    )
    .min(1)
    .max(5000)
    .openapi("The transactions to enrich"),
});

export const EnrichSchema = z
  .object({
    data: z.array(
      z.object({
        category: z.string().openapi("The category of the transaction"),
        company: z.string().openapi("The company name"),
        website: z.string().url().openapi("The website of the company"),
        subscription: z
          .boolean()
          .openapi(
            "Whether the transaction is a recurring subscription payment",
          ),
      }),
    ),
  })
  .openapi("EnrichSchema");
