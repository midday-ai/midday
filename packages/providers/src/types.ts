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

export type Institution = {
  id: string;
  name: string;
  logo?: string; // GoCardLess
};

export type Account = {
  account_id: string;
  name: string;
  currency: string;
  provider: Providers;
  institution?: Institution;
  enrollment_id?: string; // Teller
};

export type GetTransactionsRequest = {
  teamId: string;
  accountId: string;
  dateFrom?: string;
  dateTo?: string;
  accessToken?: string; // Teller
};

export type GetAccountsRequest = {
  accountId: string;
  id?: string; // GoCardLess
  countryCode?: string; // GoCardLess
  accessToken?: string; // Teller
};

export type GetTransactionsResponse = Transaction[];

export type GetAccountsResponse = Account[];
