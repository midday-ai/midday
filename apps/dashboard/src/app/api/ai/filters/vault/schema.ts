import { z } from "zod";

export const vaultFilterSchema = z.object({
  name: z
    .string()
    .optional()
    .describe(
      "The name or description to search for. Only use this if the prompt mentions a specific name or description.",
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
});

export type VaultFilterSchema = z.infer<typeof vaultFilterSchema>;

export const vaultFilterOutputSchema = z.object({
  q: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  start: z.string().nullable(),
  end: z.string().nullable(),
});

export type VaultFilterOutput = z.infer<typeof vaultFilterOutputSchema>;
