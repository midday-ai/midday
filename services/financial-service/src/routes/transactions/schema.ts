import { Providers } from "@/common/schema";
import { z } from "@hono/zod-openapi";

/**
 * Schema for transaction query parameters.
 * @property {Providers} provider - The provider of the transaction data.
 * @property {string} accountId - The account ID for which to fetch transactions.
 * @property {("credit"|"depository"|"other_asset"|"loan"|"other_liability")} [accountType] - The type of account.
 * @property {string} [accessToken] - Access token for Teller and Plaid providers.
 * @property {boolean} [latest] - Whether to fetch only the latest transactions.
 */
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
      .enum(["credit", "depository", "other_asset", "loan", "other_liability"])
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

/**
 * Schema for a single transaction.
 * @property {string} id - Unique identifier for the transaction.
 * @property {string|null} description - Description of the transaction.
 * @property {string|null} method - Method of the transaction.
 * @property {number} amount - Amount of the transaction.
 * @property {string} name - Name associated with the transaction.
 * @property {string} date - Date of the transaction.
 * @property {string} currency - Currency of the transaction.
 * @property {("pending"|"posted")} status - Status of the transaction.
 * @property {string|null} category - Category of the transaction.
 * @property {number|null} balance - Balance after the transaction.
 */
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
    internal_id: z.string(),
    bank_account_id: z.string(),
    currency_rate: z.number().nullable(),
    currency_source: z.string().nullable(),
    assigned_id: z.string().nullable().optional(),
    category_slug: z.string().nullable().optional(),
    manual: z.boolean().nullable().optional(),
    account_id: z.string().nullable(),
    account_owner: z.string().nullable().optional(),
    iso_currency_code: z.string().nullable().optional(),
    unofficial_currency_code: z.string().nullable().optional(),
    category_id: z.string().nullable().optional(),
    authorized_date: z.date().nullable().optional(),
    authorized_datetime: z.date().nullable().optional(),
    location_address: z.string().nullable().optional(),
    location_city: z.string().nullable().optional(),
    location_region: z.string().nullable().optional(),
    location_postal_code: z.string().nullable().optional(),
    location_country: z.string().nullable().optional(),
    location_lat: z.number().nullable().optional(),
    location_lon: z.number().nullable().optional(),
    location_store_number: z.string().nullable().optional(),
    merchant_name: z.string().nullable().optional(),
    merchant_entity_id: z.string().nullable().optional(),
    logo_url: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    payment_meta_by_order_of: z.string().nullable().optional(),
    payment_meta_payer: z.string().nullable().optional(),
    payment_meta_payee: z.string().nullable().optional(),
    payment_meta_payment_method: z.string().nullable().optional(),
    payment_meta_payment_processor: z.string().nullable().optional(),
    payment_meta_ppd_id: z.string().nullable().optional(),
    payment_meta_reason: z.string().nullable().optional(),
    payment_meta_reference_number: z.string().nullable().optional(),
    payment_channel: z.string().nullable().optional(),
    pending: z.boolean().nullable().optional(),
    pending_transaction_id: z.string().nullable().optional(),
    personal_finance_category_primary: z.string().nullable().optional(),
    personal_finance_category_detailed: z.string().nullable().optional(),
    personal_finance_category_confidence_level: z
      .string()
      .nullable()
      .optional(),
    personal_finance_category_icon_url: z.string().nullable().optional(),
    transaction_id: z.string().nullable().optional(),
    transaction_code: z.string().nullable().optional(),
    transaction_type: z.string().nullable().optional(),
    check_number: z.string().nullable().optional(),
  })
  .openapi("TransactionSchema");

/**
 * Schema for a list of transactions.
 * @property {TransactionSchema[]} data - Array of transactions.
 */
export const TransactionsSchema = z
  .object({
    data: z.array(TransactionSchema),
  })
  .openapi("TransactionsSchema");

/**
 * Schema for recurring transactions query parameters.
 * @property {Providers.Enum.plaid} provider - The provider (only Plaid supported).
 * @property {string} accessToken - Access token for Plaid.
 * @property {string} accountId - Account ID for Plaid.
 */
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

/**
 * Schema for recurring transaction frequency.
 */
const RecurringTransactionFrequencySchema = z.enum([
  "weekly",
  "bi-weekly",
  "monthly",
  "yearly",
  "semi-monthly",
  "unknown",
]);

/**
 * Schema for recurring transaction amount.
 * @property {number} amount - The transaction amount.
 * @property {string|null} iso_currency_code - ISO currency code.
 * @property {string|null} unofficial_currency_code - Unofficial currency code.
 */
const RecurringTransactionAmountSchema = z.object({
  amount: z.number(),
  iso_currency_code: z.string().nullable(),
  unofficial_currency_code: z.string().nullable(),
});

/**
 * Schema for recurring transaction status.
 */
const RecurringTransactionStatusSchema = z.enum([
  "mature",
  "early_detection",
  "tombstoned",
  "unknown",
]);

/**
 * Schema for recurring transaction category.
 * @property {string} primary - Primary category.
 * @property {string} detailed - Detailed category.
 * @property {string} confidence_level - Confidence level of the categorization.
 */
const RecurringTransactionCategorySchema = z.object({
  primary: z.string(),
  detailed: z.string(),
  confidence_level: z.string(),
});

/**
 * Schema for a recurring transaction.
 * @property {string} account_id - ID of the account associated with the recurring transaction.
 * @property {string} recurring_transaction_id - Unique identifier for the recurring transaction.
 * @property {string} description - Description of the recurring transaction.
 * @property {string|null} merchant_name - Name of the merchant.
 * @property {string} first_date - Date of the first occurrence.
 * @property {string} last_date - Date of the last occurrence.
 * @property {RecurringTransactionFrequencySchema} frequency - Frequency of the recurring transaction.
 * @property {string[]} transaction_ids - Array of transaction IDs associated with this recurring transaction.
 * @property {RecurringTransactionAmountSchema} average_amount - Average amount of the recurring transaction.
 * @property {RecurringTransactionAmountSchema} last_amount - Amount of the last occurrence.
 * @property {boolean} is_active - Whether the recurring transaction is active.
 * @property {RecurringTransactionStatusSchema} status - Status of the recurring transaction.
 * @property {RecurringTransactionCategorySchema|null} personal_finance_category - Personal finance category of the recurring transaction.
 * @property {boolean} is_user_modified - Whether the recurring transaction has been modified by the user.
 * @property {string|null} last_user_modified_datetime - Datetime of the last user modification.
 */
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

/**
 * Schema for the response of getting recurring transactions.
 * @property {RecurringTransactionSchema[]} inflow - Array of incoming recurring transactions.
 * @property {RecurringTransactionSchema[]} outflow - Array of outgoing recurring transactions.
 * @property {string} last_updated_at - Timestamp of the last update.
 */
export const GetRecurringTransactionsResponseSchema = z.object({
  inflow: z.array(RecurringTransactionSchema),
  outflow: z.array(RecurringTransactionSchema),
  last_updated_at: z.string(),
});

/**
 * Schema for a list of recurring transactions.
 * @property {RecurringTransactionSchema[]} data - Array of recurring transactions.
 */
export const RecurringTransactionsSchema = z
  .object({
    data: z.array(RecurringTransactionSchema),
  })
  .openapi("RecurringTransactionsSchema");
