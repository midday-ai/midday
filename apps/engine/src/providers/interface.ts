import type {
  DeleteAccountsRequest,
  DeleteConnectionRequest,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsRequest,
  GetAccountsResponse,
  GetConnectionStatusRequest,
  GetConnectionStatusResponse,
  GetInstitutionsRequest,
  GetInstitutionsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
} from "./types";

export interface Provider {
  getTransactions: (
    params: GetTransactionsRequest,
  ) => Promise<GetTransactionsResponse>;
  getAccounts: (params: GetAccountsRequest) => Promise<GetAccountsResponse>;
  getAccountBalance: (
    params: GetAccountBalanceRequest,
  ) => Promise<GetAccountBalanceResponse>;
  getInstitutions: (
    params: GetInstitutionsRequest,
  ) => Promise<GetInstitutionsResponse>;
  getHealthCheck: () => Promise<boolean>;
  deleteAccounts: (params: DeleteAccountsRequest) => void;
  getConnectionStatus: (
    params: GetConnectionStatusRequest,
  ) => Promise<GetConnectionStatusResponse>;
  deleteConnection: (params: DeleteConnectionRequest) => void;
}
