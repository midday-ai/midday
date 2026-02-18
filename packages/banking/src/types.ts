import type { AccountType } from "./utils/account";

export type Providers = "teller" | "plaid" | "gocardless" | "enablebanking";

export type ProviderParams = {
  provider: Providers;
};

export type Transaction = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  status: "posted" | "pending";
  balance: number | null;
  category: string | null;
  counterparty_name: string | null;
  merchant_name: string | null;
  method: string;
  name: string;
  description: string | null;
  currency_rate: number | null;
  currency_source: string | null;
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
  enrollment_id: string | null;
  resource_id: string | null;
  expires_at: string | null;
  iban: string | null;
  subtype: string | null;
  bic: string | null;
  routing_number: string | null;
  wire_routing_number: string | null;
  account_number: string | null;
  sort_code: string | null;
  available_balance: number | null;
  credit_limit: number | null;
};

export type ConnectionStatus = {
  status: "connected" | "disconnected";
};

export type Balance = {
  amount: number;
  currency: string;
};

export type GetTransactionsRequest = {
  accountId: string;
  latest?: boolean;
  accessToken?: string;
  accountType: AccountType;
};

export type GetAccountsRequest = {
  id?: string;
  accessToken?: string;
  institutionId?: string;
};

export type GetAccountBalanceRequest = {
  accountId: string;
  accessToken?: string;
  accountType?: string;
};

export type GetAccountBalanceResponse = {
  currency: string;
  amount: number;
  available_balance: number | null;
  credit_limit: number | null;
};

export type DeleteAccountsRequest = {
  accountId?: string;
  accessToken?: string;
};

export type GetConnectionStatusRequest = {
  id?: string;
  accessToken?: string;
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
  enablebanking: HealthCheckResponse;
};

export type GetConnectionStatusResponse = ConnectionStatus;

export type DeleteConnectionRequest = {
  id: string;
  accessToken?: string;
};
