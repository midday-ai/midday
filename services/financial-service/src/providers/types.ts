import type { AccountType } from "@/utils/account";
import { R2Bucket } from "@cloudflare/workers-types";

export type Providers = "teller" | "plaid" | "gocardless" | "stripe";

export type ProviderParams = {
  provider: Providers;
  kv: KVNamespace;
  fetcher?: Fetcher | null; // Teller
  envs: {
    GOCARDLESS_SECRET_KEY: string;
    GOCARDLESS_SECRET_ID: string;
    PLAID_CLIENT_ID: string;
    PLAID_SECRET: string;
    PLAID_ENVIRONMENT: string;
    STRIPE_SECRET_KEY: string;
  };
  r2: R2Bucket;
};

/**
 * Represents a financial transaction with detailed information.
 */
export type Transaction = {
  /** Unique identifier for the transaction */
  id: string;
  /** The transaction amount */
  amount: number;
  /** The currency code of the transaction */
  currency: string;
  /** The date of the transaction in ISO 8601 format */
  date: string;
  /** The status of the transaction */
  status: "posted" | "pending";
  /** The account balance after this transaction, if available */
  balance: number | null;
  /** The category of the transaction, if available */
  category: string | null;
  /** The method used for the transaction */
  method: string;
  /** The name or title of the transaction */
  name: string;
  /** Additional description of the transaction, if available */
  description: string | null;
  /** The exchange rate used for currency conversion, if applicable */
  currency_rate: number | null;
  /** The source currency for conversion, if applicable */
  currency_source: string | null;
  /** Internal identifier for the transaction */
  internal_id: string;
  /** Identifier for the bank account associated with this transaction */
  bank_account_id: string;
  /** Optional assigned identifier for the transaction */
  assigned_id?: string | null;
  /** Slug representation of the transaction category, if available */
  category_slug?: string | null;
  /** Indicates if the transaction was manually entered */
  manual?: boolean | null;
  /** Identifier for the account associated with this transaction */
  account_id: string | null;
  /** Name of the account owner, if available */
  account_owner?: string | null;
  /** ISO currency code for the transaction */
  iso_currency_code?: string | null;
  /** Unofficial currency code, if applicable */
  unofficial_currency_code?: string | null;
  /** Identifier for the transaction category */
  category_id?: string | null;
  /** Date when the transaction was authorized */
  authorized_date?: Date | null;
  /** Exact datetime when the transaction was authorized */
  authorized_datetime?: Date | null;
  /** Address where the transaction occurred */
  location_address?: string | null;
  /** City where the transaction occurred */
  location_city?: string | null;
  /** Region or state where the transaction occurred */
  location_region?: string | null;
  /** Postal code where the transaction occurred */
  location_postal_code?: string | null;
  /** Country where the transaction occurred */
  location_country?: string | null;
  /** Latitude of the transaction location */
  location_lat?: number | null;
  /** Longitude of the transaction location */
  location_lon?: number | null;
  /** Store number, if applicable */
  location_store_number?: string | null;
  /** Name of the merchant */
  merchant_name?: string | null;
  /** Unique identifier for the merchant entity */
  merchant_entity_id?: string | null;
  /** URL to the merchant's logo */
  logo_url?: string | null;
  /** Website of the merchant */
  website?: string | null;
  /** Entity that ordered the payment */
  payment_meta_by_order_of?: string | null;
  /** Entity that made the payment */
  payment_meta_payer?: string | null;
  /** Entity that received the payment */
  payment_meta_payee?: string | null;
  /** Method used for the payment */
  payment_meta_payment_method?: string | null;
  /** Payment processor used for the transaction */
  payment_meta_payment_processor?: string | null;
  /** ID used for ACH transactions */
  payment_meta_ppd_id?: string | null;
  /** Reason for the payment */
  payment_meta_reason?: string | null;
  /** Reference number for the payment */
  payment_meta_reference_number?: string | null;
  /** Channel through which the payment was made */
  payment_channel?: string | null;
  /** Indicates if the transaction is pending */
  pending?: boolean | null;
  /** ID of the pending transaction, if applicable */
  pending_transaction_id?: string | null;
  /** Primary category for personal finance */
  personal_finance_category_primary?: string | null;
  /** Detailed category for personal finance */
  personal_finance_category_detailed?: string | null;
  /** Confidence level of the personal finance categorization */
  personal_finance_category_confidence_level?: string | null;
  /** URL to an icon representing the personal finance category */
  personal_finance_category_icon_url?: string | null;
  /** Alternative transaction ID */
  transaction_id?: string | null;
  /** Code associated with the transaction */
  transaction_code?: string | null;
  /** Type of the transaction */
  transaction_type?: string | null;
  /** Check number, if applicable */
  check_number?: string | null;
};

// Recurring transaction frequency
export type RecurringTransactionFrequency =
  | "weekly"
  | "bi-weekly"
  | "monthly"
  | "yearly"
  | "semi-monthly"
  | "unknown";

// Recurring transaction amount
export type RecurringTransactionAmount = {
  amount: number;
  iso_currency_code: string | undefined;
  unofficial_currency_code: string | undefined;
};

// Recurring transaction status
export type RecurringTransactionStatus =
  | "mature"
  | "early_detection"
  | "tombstoned"
  | "unknown";

// Recurring transaction category
export type RecurringTransactionCategory = {
  primary: string;
  detailed: string;
  confidence_level: string;
};

/**
 * Represents a recurring financial transaction or stream of transactions.
 */
export type RecurringTransaction = {
  /** The ID of the account to which the stream belongs */
  account_id: string;
  /** A unique id for the stream */
  stream_id: string;
  /**
   * A hierarchical array of the categories to which this transaction belongs.
   * @deprecated Use personal_finance_category instead.
   */
  category: Array<string>;
  /**
   * The ID of the category to which this transaction belongs.
   * @deprecated Use personal_finance_category instead.
   */
  category_id: string;
  /** A description of the transaction stream */
  description: string;
  /** The merchant associated with the transaction stream */
  merchant_name: string | null;
  /** The posted date of the earliest transaction in the stream */
  first_date: string;
  /** The posted date of the latest transaction in the stream */
  last_date: string;
  /** The frequency of the recurring transaction */
  frequency: RecurringTransactionFrequency;
  /** An array of Plaid transaction IDs belonging to the stream, sorted by posted date */
  transaction_ids: Array<string>;
  /** The average amount of the transactions in this stream */
  average_amount: RecurringTransactionAmount;
  /** The amount of the most recent transaction in this stream */
  last_amount: RecurringTransactionAmount;
  /** Indicates whether the transaction stream is still active */
  is_active: boolean;
  /** The status of the recurring transaction stream */
  status: RecurringTransactionStatus;
  /** Detailed categorization of the recurring transaction */
  personal_finance_category?: RecurringTransactionCategory | null;
  /** Indicates if the stream has been modified by a user request */
  is_user_modified: boolean;
  /** The date and time of the most recent user modification */
  last_user_modified_datetime?: string;
};

/**
 * Represents a financial institution.
 */
export type Institution = {
  /** Unique identifier for the institution */
  id: string;
  /** Name of the institution */
  name: string;
  /** URL to the institution's logo */
  logo: string | null;
  /** The financial data provider for this institution */
  provider: Providers;
};

/**
 * Represents a financial account.
 */
export type Account = {
  /** Unique identifier for the account */
  id: string;
  /** Name of the account */
  name: string;
  /** Currency code for the account */
  currency: string;
  /** Type of the account */
  type: AccountType;
  /** The institution associated with this account */
  institution: Institution;
  /** Current balance of the account */
  balance: Balance;
  /** Enrollment ID for the account (Teller-specific) */
  enrollment_id: string | null;
};

/**
 * Represents the balance of an account.
 */
export type Balance = {
  /** Available balance, which can be a single number or an array of amounts in different currencies */
  available: number | { amount: number; currency: string }[];
  /** Current balance amount */
  amount: number;
  /** Currency code for the balance */
  currency: string;
};

export type GetTransactionsRequest = {
  accountId: string;
  latest?: boolean;
  accessToken?: string; // Teller & Plaid
  accountType: AccountType;
};

export type GetAccountsRequest = {
  id?: string; // GoCardLess
  accessToken?: string; // Teller & Plaid
  institutionId?: string; // Plaid
  stripeAccountId?: string; // Stripe
};

export type GetAccountBalanceRequest = {
  accountId: string;
  accessToken?: string; // Teller & Plaid
};

export type GetAccountBalanceResponse = {
  currency: string;
  amount: number;
};

export type DeleteAccountsRequest = {
  accountId?: string; // GoCardLess
  accessToken?: string; // Teller & Plaid
};

export type GetTransactionsResponse = Transaction[];

export type GetAccountsResponse = Account[];

export type GetInstitutionsResponse = {
  id: string;
  name: string;
  logo: string | null;
  provider: Providers;
}[];

export type GetInstitutionsRequest = {
  countryCode?: string;
};

export type HealthCheckResponse = {
  healthy: boolean;
};

export type GetHealthCheckResponse = {
  teller: HealthCheckResponse;
  gocardless: HealthCheckResponse;
  plaid: HealthCheckResponse;
};

export type GetStatementsRequest = {
  accessToken: string;
  accountId: string;
  userId: string;
  teamId: string;
};

export type StatementMetadata = {
  account_id: string;
  statement_id: string;
  month: string;
  year: string;
};

export type GetStatementsResponse = {
  statements: StatementMetadata[];
  institution_name: string;
  item_id?: string;
  institution_id: string;
};

export type GetStatementPdfRequest = {
  accessToken: string;
  statementId: string;
  accountId: string;
  userId: string;
  teamId: string;
};

export type GetStatementPdfResponse = {
  pdf: Buffer;
  filename: string;
};

/**
 * Request parameters for fetching recurring transactions
 */
export type GetRecurringTransactionsRequest = {
  /**
   * Access token for authentication with the financial data provider
   * @example "access-sandbox-123456789"
   */
  accessToken: string;
  /**
   * ID of the account for which to fetch recurring transactions
   * @example "acc_12345"
   */
  accountId: string;
};

/**
 * Response object for fetching recurring transactions
 */
export type GetRecurringTransactionsResponse = {
  /**
   * Array of recurring transaction inflows (e.g., salary, regular deposits)
   * @see RecurringTransaction
   */
  inflow: Array<RecurringTransaction>;
  /**
   * Array of recurring transaction outflows (e.g., subscriptions, regular payments)
   * @see RecurringTransaction
   */
  outflow: Array<RecurringTransaction>;
  /**
   * ISO 8601 timestamp of when the recurring transactions were last updated
   * @example "2023-04-01T12:00:00Z"
   */
  last_updated_at: string;
};
