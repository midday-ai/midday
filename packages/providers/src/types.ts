export type Providers = "teller" | "plaid" | "gocardless";

export type TransactionProviderParams = {
  provider: Providers;
  environment?: "development" | "staging" | "production";
};

export type Transaction = {
  amount: string;
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
  description?: string;
  currency_rate?: number;
  currency_source?: string;
};

export type Account = {
  created_by: string;
  team_id: string;
  account_id: string;
  name: string;
  currency: string;
  bank_connection_id: string;
  provider: Providers;
};

export type GetTransactionsRequest = {
  teamId: string;
  accountId: string;
  dateFrom?: string;
  dateTo?: string;
  accessToken?: string; // Teller
};

export type GetAccountsRequest = {
  id: string;
  userId: string;
  teamId: string;
  accountId: string;
  bankConnectionId: string;
  countryCode?: string; // GoCardLess
};
