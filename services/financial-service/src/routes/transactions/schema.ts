import { Providers } from "@/common/schema";
import { z } from "@hono/zod-openapi";

export const TransactionsParamsSchema = z
  .object({
    provider: Providers.openapi({
      param: {
        name: "provider",
        in: "query",
      },
      example: Providers.Enum.stripe,
    }),
    accountId: z.string().openapi({
      description:
        "Get transactions by accountId (Stripe account holder reference for Stripe)",
      param: {
        name: "accountId",
        in: "query",
      },
      example: "acct_1234567890",
    }),
    accountType: z
      .enum([
        "credit",
        "depository",
        "other_asset",
        "loan",
        "other_liability",
      ])
      .optional()
      .openapi({
        description:
          "Get transactions with the correct amount depending on credit or depository",
        param: {
          name: "accountType",
          in: "query",
        },
        example: "depository",
      }),
    accessToken: z
      .string()
      .optional()
      .openapi({
        description: "Used for Teller and Plaid",
        param: {
          name: "accessToken",
          in: "query",
        },
        example: "token-123",
      }),
    latest: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional()
      .openapi({
        description: "Get latest transactions",
        param: {
          name: "latest",
          in: "query",
        },
        example: "true",
      }),
  })
  .openapi("TransactionsParamsSchema");

export const TransactionSchema = z
  .object({
    id: z.string().openapi({
      example: "9293961c-df93-4d6d-a2cc-fc3e353b2d10",
    }),
    description: z
      .string()
      .openapi({
        example: "Transfer to bank account",
      })
      .nullable(),
    method: z
      .string()
      .openapi({
        example: "other",
      })
      .nullable(),
    amount: z.number().openapi({
      example: 100,
    }),
    name: z.string().openapi({
      example: "Vercel Inc.",
    }),
    date: z.string().openapi({
      example: "2024-06-12",
    }),
    currency: z.string().openapi({
      example: "USD",
    }),
    status: z.enum(["pending", "posted"]).openapi({
      example: "posted",
    }),
    category: z
      .string()
      .openapi({
        example: "travel",
      })
      .nullable(),
    balance: z
      .number()
      .openapi({
        example: 10000,
      })
      .nullable(),
  })
  .openapi("TransactionSchema");

export const TransactionsSchema = z
  .object({
    data: z.array(TransactionSchema),
  })
  .openapi("TransactionsSchema");


export const RecurringTransactionsParamsSchema = z
  .object({
    provider: z.literal(Providers.Enum.plaid).openapi({
      param: {
        name: "provider",
        in: "query",
      },
      example: Providers.Enum.plaid,
    }),
    accessToken: z.string().openapi({
      description: "Access token for Plaid",
      param: {
        name: "accessToken",
        in: "query",
      },
      example: "access-token-123",
    }),
    accountId: z.string().openapi({
      description: "Account ID for Plaid",
      param: {
        name: "accountId",
        in: "query",
      },
      example: "account-id-123",
    }),
  })
  .openapi("RecurringTransactionsParamsSchema");

const RecurringTransactionFrequencySchema = z.enum([
  "weekly",
  "bi-weekly",
  "monthly",
  "yearly",
  "semi-monthly",
  "unknown",
]);

const RecurringTransactionAmountSchema = z.object({
  amount: z.number(),
  iso_currency_code: z.string().nullable(),
  unofficial_currency_code: z.string().nullable(),
});

const RecurringTransactionStatusSchema = z.enum([
  "mature",
  "early_detection",
  "tombstoned",
  "unknown",
]);

const RecurringTransactionCategorySchema = z.object({
  primary: z.string(),
  detailed: z.string(),
  confidence_level: z.string(),
});

export const RecurringTransactionSchema = z.object({
  account_id: z.string(),
  recurring_transaction_id: z.string(),
  description: z.string(),
  merchant_name: z.string().nullable(),
  first_date: z.string(),
  last_date: z.string(),
  frequency: RecurringTransactionFrequencySchema,
  transaction_ids: z.array(z.string()),
  average_amount: RecurringTransactionAmountSchema,
  last_amount: RecurringTransactionAmountSchema,
  is_active: z.boolean(),
  status: RecurringTransactionStatusSchema,
  personal_finance_category: RecurringTransactionCategorySchema.nullable(),
  is_user_modified: z.boolean(),
  last_user_modified_datetime: z.string().nullable(),
});

export const GetRecurringTransactionsResponseSchema = z.object({
  inflow: z.array(RecurringTransactionSchema),
  outflow: z.array(RecurringTransactionSchema),
  last_updated_at: z.string(),
});

export const RecurringTransactionsSchema = z
  .object({
    data: z.array(RecurringTransactionSchema),
  })
  .openapi("RecurringTransactionsSchema");