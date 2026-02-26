import { z } from "zod";

export const dealFilterSchema = z.object({
  name: z
    .string()
    .optional()
    .describe(
      "The merchant/company name to search for. Only use this if the prompt mentions a specific company or merchant name.",
    ),
  statuses: z
    .array(
      z.enum(["draft", "overdue", "paid", "unpaid", "canceled", "refunded"]),
    )
    .optional()
    .describe(
      "Only set this if the prompt explicitly mentions deal statuses (e.g., 'unpaid deals', 'draft deals', 'refunded deals').",
    ),
  start: z.coerce
    .string()
    .optional()
    .describe(
      "The start date in ISO-8601 format. Only set this if the prompt explicitly mentions a date range or time period (e.g., 'this month', 'last year').",
    ),
  end: z.coerce
    .string()
    .optional()
    .describe(
      "The end date in ISO-8601 format. Only set this if the prompt explicitly mentions a date range or time period. Do NOT default to current date unless explicitly requested.",
    ),
  merchants: z
    .array(z.string())
    .optional()
    .describe(
      "Only set this if the prompt explicitly mentions merchant names from the available merchants list.",
    ),
});

export type DealFilterSchema = z.infer<typeof dealFilterSchema>;

export const dealFilterOutputSchema = z.object({
  q: z.string().nullable(),
  statuses: z.array(z.string()).nullable(),
  merchants: z.array(z.string()).nullable(),
  start: z.string().nullable(),
  end: z.string().nullable(),
});

export type DealFilterOutput = z.infer<typeof dealFilterOutputSchema>;
