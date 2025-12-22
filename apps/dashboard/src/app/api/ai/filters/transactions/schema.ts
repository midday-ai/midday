import { z } from "zod";

export const transactionsFilterSchema = z.object({
  name: z
    .string()
    .optional()
    .describe(
      "The merchant/company name to search for in transaction names. Only use this if the prompt mentions a specific company or merchant name.",
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
  attachments: z
    .enum(["exclude", "include"])
    .optional()
    .describe(
      "Only set this if the prompt explicitly mentions receipts or attachments (e.g., 'with receipts', 'without attachments').",
    ),
  categories: z
    .array(z.string())
    .optional()
    .describe(
      "Only set this if the prompt explicitly mentions category names from the available categories list.",
    ),
  tags: z
    .array(z.string())
    .optional()
    .describe(
      "Only set this if the prompt explicitly mentions tag names from the available tags list.",
    ),
  recurring: z
    .array(z.enum(["all", "weekly", "monthly", "annually"]))
    .optional()
    .describe(
      "Only set this if the prompt explicitly mentions recurring transactions.",
    ),
  amount_range: z
    .array(z.number())
    .optional()
    .describe(
      "Only set this if the prompt explicitly mentions an amount range (e.g., 'over $100', 'between $50 and $200').",
    ),
});

export type TransactionsFilterSchema = z.infer<typeof transactionsFilterSchema>;

export const transactionFilterOutputSchema = z.object({
  q: z.string().nullable(),
  attachments: z.enum(["exclude", "include"]).nullable(),
  start: z.string().nullable(),
  end: z.string().nullable(),
  categories: z.array(z.string()).nullable(),
  tags: z.array(z.string()).nullable(),
  accounts: z.array(z.string()).nullable(),
  assignees: z.array(z.string()).nullable(),
  amount_range: z.array(z.number()).nullable(),
  amount: z.array(z.string()).nullable(),
  recurring: z
    .array(z.enum(["all", "weekly", "monthly", "annually"]))
    .nullable(),
  statuses: z
    .array(
      z.enum(["completed", "uncompleted", "archived", "excluded", "exported"]),
    )
    .nullable(),
  manual: z.enum(["exclude", "include"]).nullable(),
});

export type TransactionFilterOutput = z.infer<
  typeof transactionFilterOutputSchema
>;
