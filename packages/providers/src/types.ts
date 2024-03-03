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
};

export type GetAccountsParams = {
  accountId: string;
  countryCode?: string;
};
