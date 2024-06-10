export type Providers = "teller" | "plaid" | "gocardless";

export type ProviderParams = {
  provider: Providers;
  kv: KVNamespace;
  environment?: "development" | "staging" | "production";
  fetcher?: Fetcher; // Teller
};

export type Transaction = {
  amount: number;
  currency: string;
  date: string;
  internal_id: string;
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

export type Balance = {
  amount: number;
  currency: string;
};

export type GetTransactionsRequest = {
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

export type GetAccountBalanceRequest = {
  accountId: string;
  accessToken?: string; // Teller & Plaid
};

export type GetAccountBalanceResponse = {
  currency: string;
  amount: number;
};

export type DeleteAccountRequest = {
  accountId: string;
  accessToken?: string; // Teller & Plaid
};

export type GetTransactionsResponse = Transaction[];

export type GetAccountsResponse = Account[];

type HealthCheckResponse = {
  healthy: boolean;
};

export type GetHealthCheckResponse = {
  teller: HealthCheckResponse;
  gocardless: HealthCheckResponse;
  plaid: HealthCheckResponse;
};
