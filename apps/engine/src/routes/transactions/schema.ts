import { z } from "@hono/zod-openapi";

export const TransactionsParamsSchema = z.object({
  latest: z
    .string()
    .optional()
    .openapi({
      description: "Get latest transactions",
      param: {
        name: "latest",
        in: "query",
      },
      example: "true",
    }),
});

export const TransactionSchema = z
  .object({
    id: z.string().openapi({
      example: "9293961c-df93-4d6d-a2cc-fc3e353b2d10",
    }),
    name: z.string().openapi({
      example: "Vercel Inc.",
    }),
    currency: z.string().openapi({
      example: "USD",
    }),
  })
  .openapi("Transaction");

export const TransactionsSchema = z
  .object({
    data: z.array(TransactionSchema),
  })
  .openapi("Transactions");
