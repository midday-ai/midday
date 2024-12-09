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
    .max(50)
    .openapi("The transactions to enrich"),
});

export const EnrichSchema = z
  .object({
    data: z.array(
      z.object({
        category: z
          .string()
          .openapi("The category of the transaction")
          .nullable(),
        company: z.string().openapi("The company name").nullable(),
        website: z
          .string()
          .url()
          .openapi("The website of the company")
          .nullable(),
        subscription: z
          .boolean()
          .openapi(
            "Whether the transaction is a recurring subscription payment",
          ),
      }),
    ),
  })
  .openapi("EnrichSchema");

export const OutputSchema = z.object({
  category: z
    .enum([
      "travel",
      "office_supplies",
      "meals",
      "software",
      "rent",
      "equipment",
      "internet_and_telephone",
      "facilities_expenses",
      "activity",
      "taxes",
      "fees",
    ])
    .describe("The category of the transaction")
    .nullable(),
  company: z.string().describe("The company name").nullable(),
  website: z
    .string()
    .describe("The website of the company, only root domains without protocol")
    .nullable(),
  subscription: z
    .boolean()
    .describe("Whether the transaction is a recurring subscription payment")
    .default(false),
});

export type EnrichBody = z.infer<typeof EnrichBodySchema>;
