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
};

export type Accounts = {
  id: string;
  provider: Providers;
};

export type GetTransactionsParams = {
  teamId: string;
  accountId: string;
  dateFrom?: string;
  dateTo?: string;
  accessToken?: string; // Teller
};

export type GetAccountsParams = {
  accountId: string;
  countryCode?: string;
};
