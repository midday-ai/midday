import type { AccountType } from "@/utils/account";
import type {
  AccountsGetResponse,
  Institution as BaseInstitution,
  Transaction,
  TransactionsSyncResponse,
} from "plaid";

export type LinkTokenCreateRequest = {
  userId: string;
  language?: string;
  accessToken?: string;
  environment?: "sandbox" | "production";
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

export type TransformInstitution = BaseInstitution;

export type AccountWithInstitution = AccountsGetResponse["accounts"][0] & {
  institution: Institution;
};

export type GetAccountsResponse = AccountWithInstitution[];

export type TransformAccount = AccountWithInstitution;

export type TransformAccountBalance =
  AccountsGetResponse["accounts"][0]["balances"];

export type TransformTransaction = Transaction;

export type GetTransactionsResponse = TransactionsSyncResponse["added"];

export type GetAccountBalanceResponse =
  AccountsGetResponse["accounts"][0]["balances"];

export interface GetAccountBalanceRequest {
  accessToken: string;
  accountId: string;
}

export type TransformTransactionPayload = {
  transaction: TransformTransaction;
  accountType: AccountType;
};

export type DisconnectAccountRequest = {
  accessToken: string;
};

export type GetConnectionStatusRequest = {
  accessToken: string;
};
