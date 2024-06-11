import type {
  AccountsGetResponse,
  Transaction,
  TransactionsSyncResponse,
} from "plaid";

export type LinkTokenCreateRequest = {
  userId: string;
  language: string;
};

export type GetStatusResponse = {
  page: {
    id: string;
    name: string;
    url: string;
    time_zone: string;
    updated_at: string;
  };
  status: {
    indicator: string;
    description: string;
  };
};

export type GetTransactionsRequest = {
  accessToken: string;
  accountId: string;
  latest?: boolean;
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
};

export type AccountWithintitution = AccountsGetResponse["accounts"][0] & {
  institution: Institution;
};

export type GetAccountsResponse = AccountWithintitution[];

export type TransformAccount = AccountWithintitution;

export type TransformAccountBalance = AccountsGetResponse["accounts"][0];

export type TransformTransaction = Transaction;

export type GetTransactionsResponse = TransactionsSyncResponse["added"];

export type GetAccountBalanceResponse = AccountsGetResponse["accounts"][0];

export interface GetAccountBalanceRequest {
  accessToken: string;
  accountId: string;
}
