import type { AccountType } from "@midday/engine/src/utils/account";
import type {
  AccountsGetResponse,
  Transaction,
  TransactionsSyncResponse,
} from "plaid";

export type LinkTokenCreateRequest = {
  userId: string;
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

export type TransformAccountBalance =
  AccountsGetResponse["accounts"][0]["balances"];

export type TransformTransaction = {
  transaction: Transaction;
  teamId: string;
  bankAccountId: string;
  accountType: AccountType;
};

export type GetTransactionsResponse = TransactionsSyncResponse["added"];

export type GetAccountBalanceResponse =
  AccountsGetResponse["accounts"][0]["balances"];

export interface GetAccountBalanceRequest {
  accessToken: string;
  accountId: string;
}
