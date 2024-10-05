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

export type Transaction = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  status: "posted" | "pending";
  balance: number | null;
  category: string | null;
  method: string;
  name: string;
  description: string | null;
  currency_rate: number | null;
  currency_source: string | null;
  // Add suite of new fields
  internal_id: string;
  bank_account_id: string;
  assigned_id?: string | null;
  category_slug?: string | null;
  manual?: boolean | null;
  account_id: string | null;
  account_owner?: string | null;
  iso_currency_code?: string | null;
  unofficial_currency_code?: string | null;
  category_id?: string | null;
  authorized_date?: Date | null;
  authorized_datetime?: Date | null;
  location_address?: string | null;
  location_city?: string | null;
  location_region?: string | null;
  location_postal_code?: string | null;
  location_country?: string | null;
  location_lat?: number | null;
  location_lon?: number | null;
  location_store_number?: string | null;
  merchant_name?: string | null;
  merchant_entity_id?: string | null;
  logo_url?: string | null;
  website?: string | null;
  payment_meta_by_order_of?: string | null;
  payment_meta_payer?: string | null;
  payment_meta_payee?: string | null;
  payment_meta_payment_method?: string | null;
  payment_meta_payment_processor?: string | null;
  payment_meta_ppd_id?: string | null;
  payment_meta_reason?: string | null;
  payment_meta_reference_number?: string | null;
  payment_channel?: string | null;
  pending?: boolean | null;
  pending_transaction_id?: string | null;
  personal_finance_category_primary?: string | null;
  personal_finance_category_detailed?: string | null;
  personal_finance_category_confidence_level?: string | null;
  personal_finance_category_icon_url?: string | null;
  transaction_id?: string | null;
  transaction_code?: string | null;
  transaction_type?: string | null;
  check_number?: string | null;
};

export type Institution = {
  id: string;
  name: string;
  logo: string | null;
  provider: Providers;
};

export type Account = {
  id: string;
  name: string;
  currency: string;
  type: AccountType;
  institution: Institution;
  balance: Balance;
  enrollment_id: string | null; // Teller
};

export type Balance = {
  available: any;
  amount: number;
  currency: string;
};

export type GetTransactionsRequest = {
  accountId: string;
  latest?: boolean;
  accessToken?: string; // Teller & Plaid
  accountType?: AccountType;
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
