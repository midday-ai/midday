import type { Provider } from "../interface";
import type {
  DeleteAccountsRequest,
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetInstitutionsRequest,
  GetTransactionsRequest,
  ProviderParams,
} from "../types";
import type { GetStatementsRequest, GetStatementPdfRequest } from "./types";
import { PlaidApi } from "./plaid-api";
import {
  transformAccount,
  transformAccountBalance,
  transformInstitution,
  transformTransaction,
} from "./transform";

export class PlaidProvider implements Provider {
  #api: PlaidApi;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#api = new PlaidApi(params);
  }

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
      }),
    );
  }

  async getHealthCheck() {
    return this.#api.getHealthCheck();
  }

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

  async getInstitutions({ countryCode }: GetInstitutionsRequest) {
    const response = await this.#api.getInstitutions({
      countryCode,
    });

    return response.map(transformInstitution);
  }

  async deleteAccounts({ accessToken }: DeleteAccountsRequest) {
    if (!accessToken) {
      throw Error("accessToken is missing");
    }

    await this.#api.deleteAccounts({
      accessToken,
    });
  }

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

  async getStatementPdf({
    accessToken,
    statementId,
    accountId,
    userId,
    teamId,
  }: GetStatementPdfRequest) {
    if (!accessToken || !statementId || !accountId || !userId || !teamId) {
      throw Error(
        "accessToken, statementId, accountId, userId, or teamId is missing",
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
}
