import { z } from "zod";

export const getRevenueSchema = z.object({
  from: z
    .string()
    .nullable()
    .describe(
      "The start date when to retrieve data from. If not provided, defaults to the current date. Return ISO-8601 format.",
    ),
  to: z
    .string()
    .nullable()
    .describe(
      "The end date when to retrieve data from. If not provided, defaults to the current date plus 12 months. Return ISO-8601 format.",
    ),
  currency: z
    .string()
    .describe("Optional currency code (e.g., 'USD', 'SEK').")
    .nullable(),
});
