import type {
  DeleteAccountsRequest,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsRequest,
  GetAccountsResponse,
  GetInstitutionsRequest,
  GetInstitutionsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
  GetStatementsRequest,
  GetStatementsResponse,
  GetStatementPdfRequest,
  GetStatementPdfResponse,
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
  getStatements: (
    params: GetStatementsRequest,
  ) => Promise<GetStatementsResponse>;
  getStatementPdf: (
    params: GetStatementPdfRequest,
  ) => Promise<GetStatementPdfResponse>;
}
