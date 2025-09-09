import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

export const getRevenueSchema = z.object({
  from: z
    .string()
    .default(() => startOfMonth(subMonths(new Date(), 12)).toISOString())
    .describe(
      "The start date when to retrieve data from. Defaults to 12 months ago. Return ISO-8601 format.",
    ),
  to: z
    .string()
    .default(() => endOfMonth(new Date()).toISOString())
    .describe(
      "The end date when to retrieve data from. Defaults to end of current month. Return ISO-8601 format.",
    ),
  currency: z
    .string()
    .describe("Optional currency code (e.g., 'USD', 'SEK').")
    .nullable()
    .optional(),
});

export const getBurnRateSchema = z.object({
  from: z
    .string()
    .default(() => startOfMonth(subMonths(new Date(), 12)).toISOString())
    .describe(
      "The start date when to retrieve data from. Defaults to 12 months ago. Return ISO-8601 format.",
    ),
  to: z
    .string()
    .default(() => endOfMonth(new Date()).toISOString())
    .describe(
      "The end date when to retrieve data from. Defaults to end of current month. Return ISO-8601 format.",
    ),
  currency: z
    .string()
    .describe("Optional currency code (e.g., 'USD', 'SEK').")
    .nullable()
    .optional(),
});

export const getExpensesSchema = z.object({
  from: z
    .string()
    .default(() => startOfMonth(subMonths(new Date(), 12)).toISOString())
    .describe(
      "The start date when to retrieve data from. Defaults to 12 months ago. Return ISO-8601 format.",
    ),
  to: z
    .string()
    .default(() => endOfMonth(new Date()).toISOString())
    .describe(
      "The end date when to retrieve data from. Defaults to end of current month. Return ISO-8601 format.",
    ),
  currency: z
    .string()
    .describe("Optional currency code (e.g., 'USD', 'SEK').")
    .nullable()
    .optional(),
});
