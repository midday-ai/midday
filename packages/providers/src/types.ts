export enum Providers {
  Teller = "teller",
  Plaid = "plaid",
  Gocardless = "gocardless",
}

export type Transaction = {
  id: string;
  description: string;
  provider: Providers;
};

export type Accounts = {
  id: string;
  provider: Providers;
};

export type GetTransactionsParams = {
  accountId: string;
  countryCode?: string;
};

export type GetAccountsParams = {
  accountId: string;
  countryCode?: string;
};
