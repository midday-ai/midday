import type { Provider } from "../interface";
import type {
  DeleteAccountsRequest,
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetInstitutionsRequest,
  GetRecurringTransactionsRequest,
  GetRecurringTransactionsResponse,
  GetTransactionsRequest,
  ProviderParams,
} from "../types";
import { PlaidApi } from "./plaid-api";
import {
  transformAccount,
  transformAccountBalance,
  transformInstitution,
  transformRecurringTransaction,
  transformTransaction,
} from "./transform";
import type { GetStatementPdfRequest, GetStatementsRequest } from "./types";

/**
 * PlaidProvider class implements the Provider interface for Plaid integration.
 * It provides methods to interact with Plaid API for various financial operations.
 */
export class PlaidProvider implements Provider {
  #api: PlaidApi;

  /**
   * Creates an instance of PlaidProvider.
   * @param {Omit<ProviderParams, "provider">} params - Configuration parameters for the Plaid API.
   */
  constructor(params: Omit<ProviderParams, "provider">) {
    this.#api = new PlaidApi(params);
  }

  /**
   * Retrieves transactions for a specific account.
   * @param {GetTransactionsRequest} params - The request parameters.
   * @param {string} params.accessToken - The access token for the Plaid API.
   * @param {string} params.accountId - The ID of the account to fetch transactions for.
   * @param {string} [params.accountType] - The type of the account (optional).
   * @param {boolean} [params.latest] - Whether to fetch only the latest transactions (optional).
   * @returns {Promise<Array<TransformedTransaction>>} A promise that resolves to an array of transformed transactions.
   * @throws {Error} If accessToken or accountId is missing.
   */
  async getTransactions({
    accessToken,
    accountId,
    accountType,
    latest,
  }: GetTransactionsRequest) {
    if (!accessToken || !accountId) {
      throw Error("accessToken or accountId is missing");
    }

    const response = await this.#api.getTransactions({
      accessToken,
      accountId,
      latest,
    });

    return (response ?? []).map((transaction) =>
      transformTransaction({
        transaction,
        accountType,
      })
    );
  }

  /**
   * Performs a health check on the Plaid API.
   * @returns {Promise<any>} A promise that resolves to the health check response.
   */
  async getHealthCheck() {
    return this.#api.getHealthCheck();
  }

  /**
   * Retrieves accounts associated with an access token and institution.
   * @param {GetAccountsRequest} params - The request parameters.
   * @param {string} params.accessToken - The access token for the Plaid API.
   * @param {string} params.institutionId - The ID of the institution.
   * @returns {Promise<Array<TransformedAccount>>} A promise that resolves to an array of transformed accounts.
   * @throws {Error} If accessToken or institutionId is missing.
   */
  async getAccounts({ accessToken, institutionId }: GetAccountsRequest) {
    if (!accessToken || !institutionId) {
      throw Error("accessToken or institutionId is missing");
    }

    const response = await this.#api.getAccounts({
      accessToken,
      institutionId,
    });

    return (response ?? []).map(transformAccount);
  }

  /**
   * Retrieves the balance for a specific account.
   * @param {GetAccountBalanceRequest} params - The request parameters.
   * @param {string} params.accessToken - The access token for the Plaid API.
   * @param {string} params.accountId - The ID of the account to fetch the balance for.
   * @returns {Promise<TransformedAccountBalance>} A promise that resolves to the transformed account balance.
   * @throws {Error} If accessToken or accountId is missing.
   */
  async getAccountBalance({
    accessToken,
    accountId,
  }: GetAccountBalanceRequest) {
    if (!accessToken || !accountId) {
      throw Error("Missing params");
    }

    const response = await this.#api.getAccountBalance({
      accessToken,
      accountId,
    });

    return transformAccountBalance(response);
  }

  /**
   * Retrieves institutions based on the country code.
   * @param {GetInstitutionsRequest} params - The request parameters.
   * @param {string} params.countryCode - The country code to filter institutions.
   * @returns {Promise<Array<TransformedInstitution>>} A promise that resolves to an array of transformed institutions.
   */
  async getInstitutions({ countryCode }: GetInstitutionsRequest) {
    const response = await this.#api.getInstitutions({
      countryCode,
    });

    return response.map(transformInstitution);
  }

  /**
   * Deletes accounts associated with an access token.
   * @param {DeleteAccountsRequest} params - The request parameters.
   * @param {string} params.accessToken - The access token for the Plaid API.
   * @throws {Error} If accessToken is missing.
   */
  async deleteAccounts({ accessToken }: DeleteAccountsRequest) {
    if (!accessToken) {
      throw Error("accessToken is missing");
    }

    await this.#api.deleteAccounts({
      accessToken,
    });
  }

  /**
   * Retrieves statements for a specific account.
   * @param {GetStatementsRequest} params - The request parameters.
   * @param {string} params.accessToken - The access token for the Plaid API.
   * @param {string} params.accountId - The ID of the account to fetch statements for.
   * @param {string} params.userId - The ID of the user.
   * @param {string} params.teamId - The ID of the team.
   * @returns {Promise<any>} A promise that resolves to the statements response.
   * @throws {Error} If any required parameter is missing.
   */
  async getStatements({
    accessToken,
    accountId,
    userId,
    teamId,
  }: GetStatementsRequest) {
    if (!accessToken || !accountId || !userId || !teamId) {
      throw Error("accessToken, accountId, userId, or teamId is missing");
    }

    return this.#api.getStatements({ accessToken, accountId, userId, teamId });
  }

  /**
   * Retrieves a PDF statement for a specific account.
   * @param {GetStatementPdfRequest} params - The request parameters.
   * @param {string} params.accessToken - The access token for the Plaid API.
   * @param {string} params.statementId - The ID of the statement to fetch.
   * @param {string} params.accountId - The ID of the account.
   * @param {string} params.userId - The ID of the user.
   * @param {string} params.teamId - The ID of the team.
   * @returns {Promise<any>} A promise that resolves to the PDF statement response.
   * @throws {Error} If any required parameter is missing.
   */
  async getStatementPdf({
    accessToken,
    statementId,
    accountId,
    userId,
    teamId,
  }: GetStatementPdfRequest) {
    if (!accessToken || !statementId || !accountId || !userId || !teamId) {
      throw Error(
        "accessToken, statementId, accountId, userId, or teamId is missing"
      );
    }

    return this.#api.getStatementPdf({
      accessToken,
      statementId,
      accountId,
      userId,
      teamId,
    });
  }

  /**
   * Retrieves recurring transactions for a specific account.
   * @param {GetRecurringTransactionsRequest} params - The request parameters.
   * @param {string} params.accessToken - The access token for the Plaid API.
   * @param {string} params.accountId - The ID of the account to fetch recurring transactions for.
   * @returns {Promise<GetRecurringTransactionsResponse>} A promise that resolves to the recurring transactions response.
   * @throws {Error} If accessToken or accountId is missing.
   */
  async getRecurringTransactions({
    accessToken,
    accountId,
  }: GetRecurringTransactionsRequest): Promise<GetRecurringTransactionsResponse> {
    if (!accessToken || !accountId) {
      throw Error("accessToken or accountId is missing");
    }

    const response = await this.#api.getRecurringTransactions({
      accessToken,
      accountId,
    });

    const recurringInflow = response?.inflow_streams ?? [];
    const recurringOutflow = response?.outflow_streams ?? [];
    const lastUpdatedAt = response?.updated_datetime ?? "";

    // perform the transformation from transaction stream to recurring transaction
    const incomingTransactions =
      recurringInflow?.map(transformRecurringTransaction) ?? [];
    const outgoingTransactions =
      recurringOutflow?.map(transformRecurringTransaction) ?? [];

    return {
      inflow: incomingTransactions,
      outflow: outgoingTransactions,
      last_updated_at: lastUpdatedAt,
    };
  }
}
