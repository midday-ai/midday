import type {
  DeleteAccountsRequest,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsRequest,
  GetAccountsResponse,
  GetInstitutionsRequest,
  GetInstitutionsResponse,
  GetRecurringTransactionsRequest,
  GetRecurringTransactionsResponse,
  GetStatementPdfRequest,
  GetStatementPdfResponse,
  GetStatementsRequest,
  GetStatementsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
} from "./types";

export interface Provider {
  /**
   * Retrieves transactions for specified accounts.
   * @param params - The request parameters for retrieving transactions.
   * @returns A promise that resolves to the transaction data.
   */
  getTransactions: (
    params: GetTransactionsRequest,
  ) => Promise<GetTransactionsResponse>;

  /**
   * Fetches account information.
   * @param params - The request parameters for retrieving accounts.
   * @returns A promise that resolves to the account data.
   */
  getAccounts: (params: GetAccountsRequest) => Promise<GetAccountsResponse>;

  /**
   * Retrieves the balance for a specific account.
   * @param params - The request parameters for retrieving the account balance.
   * @returns A promise that resolves to the account balance data.
   */
  getAccountBalance: (
    params: GetAccountBalanceRequest,
  ) => Promise<GetAccountBalanceResponse>;

  /**
   * Fetches information about financial institutions.
   * @param params - The request parameters for retrieving institutions.
   * @returns A promise that resolves to the institution data.
   */
  getInstitutions: (
    params: GetInstitutionsRequest,
  ) => Promise<GetInstitutionsResponse>;

  /**
   * Performs a health check on the provider.
   * @returns A promise that resolves to a boolean indicating the health status.
   */
  getHealthCheck: () => Promise<boolean>;

  /**
   * Deletes specified accounts.
   * @param params - The request parameters for deleting accounts.
   */
  deleteAccounts: (params: DeleteAccountsRequest) => void;

  /**
   * Retrieves statements for specified accounts.
   * @param params - The request parameters for retrieving statements.
   * @returns A promise that resolves to the statement data.
   */
  getStatements: (
    params: GetStatementsRequest,
  ) => Promise<GetStatementsResponse>;

  /**
   * Fetches a PDF version of a specific statement.
   * @param params - The request parameters for retrieving the statement PDF.
   * @returns A promise that resolves to the statement PDF data.
   */
  getStatementPdf: (
    params: GetStatementPdfRequest,
  ) => Promise<GetStatementPdfResponse>;

  /**
   * Fetches recurring transactions for specified accounts.
   * @param params - The request parameters for retrieving recurring transactions.
   * @returns A promise that resolves to the recurring transaction data.
   * @throws Will throw an error if the request fails.
   */
  getRecurringTransactions: (
    params: GetRecurringTransactionsRequest,
  ) => Promise<GetRecurringTransactionsResponse>;
}
