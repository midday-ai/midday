import {
  Accounts,
  GetAccountsParams,
  GetTransactionsParams,
  Transaction,
} from "./types";

export interface Provider {
  getTransactions: (params: GetTransactionsParams) => Promise<Transaction[]>;
  getAccounts: (params: GetAccountsParams) => Promise<Accounts[]>;
}
