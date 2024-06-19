import type {
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsRequest,
  GetAccountsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
} from "./types";

export interface Provider {
  getTransactions: (
    params: GetTransactionsRequest
  ) => Promise<GetTransactionsResponse>;
  getAccounts: (params: GetAccountsRequest) => Promise<GetAccountsResponse>;
  getAccountBalance: (
    params: GetAccountBalanceRequest
  ) => Promise<GetAccountBalanceResponse>;
  getHealthCheck: () => Promise<boolean>;
}
