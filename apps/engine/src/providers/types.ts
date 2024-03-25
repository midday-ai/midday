export type Providers = "teller" | "plaid" | "gocardless";

export type ProviderParams = {
  provider: Providers;
  environment?: "development" | "staging" | "production";
  envs: {
    UPSTASH_REDIS_REST_URL: string;
    UPSTASH_REDIS_REST_TOKEN: string;
    GOCARDLESS_SECRET_KEY: string;
    GOCARDLESS_SECRET_ID: string;
  };
};

export type Transaction = {
  amount: number;
  currency: string;
  date: string;
  internal_id: string;
  bank_account_id: string;
  team_id: string;
  status: "posted" | "pending";
  balance?: string | null;
  category?: string | null;
  method: string;
  name: string;
  description?: string | null;
  currency_rate?: number | null;
  currency_source?: string | null;
};

export type Institution = {
  id: string;
  name: string;
  logo?: string | null;
};

export type Account = {
  id: string;
  name: string;
  currency: string;
  provider: Providers;
  institution?: Institution;
  enrollment_id?: string; // Teller
};

export type GetTransactionsRequest = {
  teamId: string;
  bankAccountId: string;
  accountId: string;
  latest?: boolean;
  accessToken?: string; // Teller & Plaid
};

export type GetAccountsRequest = {
  id?: string; // GoCardLess
  countryCode?: string; // GoCardLess
  accessToken?: string; // Teller & Plaid
  institutionId?: string; // Plaid
};

export type GetTransactionsResponse = Transaction[];

export type GetAccountsResponse = Account[];
