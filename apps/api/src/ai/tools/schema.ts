import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

export const toastSchema = z
  .object({
    visible: z.boolean(),
    currentStep: z.number().min(0),
    totalSteps: z.number().min(1),
    currentLabel: z.string(),
    stepDescription: z.string().optional(),
    completed: z.boolean().optional(),
    completedMessage: z.string().optional(),
  })
  .optional();

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
  showCanvas: z
    .boolean()
    .default(false)
    .describe(
      "Whether to show detailed visual analytics. Use true for in-depth analysis requests, trends, breakdowns, or when user asks for charts/visuals. Use false for simple questions or quick answers.",
    ),
});

export const getTransactionsSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Cursor for pagination, representing the last item from the previous page",
    ),
  sort: z
    .array(z.string().min(1))
    .max(2)
    .min(2)
    .nullable()
    .optional()
    .describe(
      "Sorting order as a tuple: [field, direction]. Example: ['date', 'desc'] or ['amount', 'asc']",
    ),
  pageSize: z
    .number()
    .min(1)
    .max(25)
    .default(10)
    .describe("Number of transactions to return per page (1-25)"),
  q: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Search query string to filter transactions by name, description, or other text fields",
    ),
  statuses: z
    .array(z.enum(["pending", "completed", "archived", "posted", "excluded"]))
    .nullable()
    .optional()
    .describe(
      "Array of transaction statuses to filter by. Available statuses: 'pending', 'completed', 'archived', 'posted', 'excluded'",
    ),
  attachments: z
    .enum(["include", "exclude"])
    .nullable()
    .optional()
    .describe(
      "Filter transactions based on attachment presence. 'include' returns only transactions with attachments, 'exclude' returns only transactions without attachments",
    ),
  categories: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Array of category slugs to filter transactions by specific categories",
    ),
  tags: z
    .array(z.string())
    .nullable()
    .optional()
    .describe("Array of tag IDs to filter transactions by specific tags"),
  accounts: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Array of bank account IDs to filter transactions by specific accounts",
    ),
  assignees: z
    .array(z.string())
    .nullable()
    .optional()
    .describe("Array of user IDs to filter transactions by assigned users"),
  type: z
    .enum(["income", "expense"])
    .nullable()
    .optional()
    .describe(
      "Transaction type to filter by. 'income' for money received, 'expense' for money spent",
    ),
  start: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Start date (inclusive) for filtering transactions in ISO 8601 format",
    ),
  end: z
    .string()
    .nullable()
    .optional()
    .describe(
      "End date (inclusive) for filtering transactions in ISO 8601 format",
    ),
  recurring: z
    .array(z.enum(["weekly", "monthly", "annually", "irregular", "all"]))
    .nullable()
    .optional()
    .describe(
      "Array of recurring frequency values to filter by. Available frequencies: 'weekly', 'monthly', 'annually', 'irregular', 'all'",
    ),
  amountRange: z
    .array(z.number().nullable())
    .length(2)
    .nullable()
    .optional()
    .describe(
      "Amount range as [min, max] to filter transactions by monetary value",
    ),
  amount: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Array of specific amounts (as strings) to filter transactions by exact values",
    ),
  currency: z
    .string()
    .nullable()
    .optional()
    .describe("Currency code to filter transactions by specific currency"),
});

export const getBalanceSheetSchema = z.object({
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
});

export const getExpensesBreakdownSchema = z.object({
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

export const getForecastSchema = z.object({
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
});
