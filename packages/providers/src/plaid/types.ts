import { AccountsGetResponse } from "plaid";

export type LinkTokenCreateRequest = {
  userId: string;
};

export type GetTransactionsRequest = {
  accessToken: string;
};

export type GetAccountsRequest = {
  accessToken: string;
  institutionId: string;
};

export type ItemPublicTokenExchangeRequest = {
  publicToken: string;
};

export type Institution = {
  id: string;
  name: string;
  logo?: string | null;
  website?: string | null;
};

export type AccountWithintitution = AccountsGetResponse["accounts"][0] & {
  institution: Institution;
};

export type GetAccountsResponse = AccountWithintitution[];

export type TransformAccountParams = {
  id: string;
  name: string;
  currency: string;
  institution: Institution;
};
