import type { Provider } from "../interface";
import type {
  DeleteAccountsRequest,
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetRecurringTransactionsRequest,
  GetRecurringTransactionsResponse,
  GetStatementPdfRequest,
  GetStatementPdfResponse,
  GetStatementsRequest,
  GetStatementsResponse,
  GetTransactionsRequest,
  ProviderParams,
} from "../types";
import { TellerApi } from "./teller-api";
import {
  transformAccount,
  transformInstitution,
  transformTransaction,
} from "./transform";

export class TellerProvider implements Provider {
  #api: TellerApi;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#api = new TellerApi(params);
  }

  async getHealthCheck() {
    return this.#api.getHealthCheck();
  }

  async getTransactions({
    accountId,
    accessToken,
    accountType,
    latest,
  }: GetTransactionsRequest) {
    if (!accessToken) {
      throw Error("accessToken missing");
    }

    const response = await this.#api.getTransactions({
      accountId,
      accessToken,
      latest,
    });

    return response.map((transaction) =>
      transformTransaction({
        transaction,
        accountType,
      }),
    );
  }

  async getAccounts({ accessToken }: GetAccountsRequest) {
    if (!accessToken) {
      throw Error("accessToken missing");
    }

    const response = await this.#api.getAccounts({ accessToken });

    return response.map(transformAccount);
  }

  async getAccountBalance({
    accessToken,
    accountId,
  }: GetAccountBalanceRequest) {
    if (!accessToken || !accountId) {
      throw Error("Missing params");
    }

    return this.#api.getAccountBalance({
      accessToken,
      accountId,
    });
  }

  async getInstitutions() {
    const response = await this.#api.getInstitutions();

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

  async getStatements(
    params: GetStatementsRequest,
  ): Promise<GetStatementsResponse> {
    if (!params.accessToken || !params.accountId) {
      throw Error("accessToken or accountId is missing");
    }

    return {
      statements: [],
      institution_name: "Unknown",
      institution_id: "Unknown",
    };
  }

  async getStatementPdf(
    params: GetStatementPdfRequest,
  ): Promise<GetStatementPdfResponse> {
    if (!params.accessToken || !params.accountId || !params.statementId) {
      throw Error("accessToken, accountId, or statementId is missing");
    }

    return {
      pdf: Buffer.from([]),
      filename: "Unknown",
    };
  }

  async getRecurringTransactions(
    params: GetRecurringTransactionsRequest,
  ): Promise<GetRecurringTransactionsResponse> {
    const { accountId } = params;
    if (!accountId) {
      throw new Error("Missing accountId");
    }

    return {
      inflow: [],
      outflow: [],
      last_updated_at: new Date().toISOString(),
    };
  }
}
