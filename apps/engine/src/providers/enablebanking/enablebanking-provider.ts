import type { Provider } from "../interface";
import type {
  ConnectionStatus,
  DeleteAccountsRequest,
  DeleteConnectionRequest,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsRequest,
  GetAccountsResponse,
  GetConnectionStatusRequest,
  GetInstitutionsRequest,
  GetInstitutionsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
  ProviderParams,
} from "../types";
import { EnableBankingApi } from "./enablebanking-api";
import {
  transformAccount,
  transformBalance,
  transformConnectionStatus,
  transformInstitution,
  transformTransaction,
} from "./transform";

export class EnableBankingProvider implements Provider {
  #api: EnableBankingApi;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#api = new EnableBankingApi(params);
  }

  async getHealthCheck(): Promise<boolean> {
    return this.#api.getHealthCheck();
  }

  async getInstitutions(
    params: GetInstitutionsRequest,
  ): Promise<GetInstitutionsResponse> {
    const response = await this.#api.getInstitutions();
    return response.aspsps.map(transformInstitution);
  }

  async getAccounts({ id }: GetAccountsRequest): Promise<GetAccountsResponse> {
    if (!id) {
      throw Error("Missing params");
    }

    const response = await this.#api.getAccounts({ id });
    console.log(response);
    return response.map(transformAccount);
  }

  async getAccountBalance(
    params: GetAccountBalanceRequest,
  ): Promise<GetAccountBalanceResponse> {
    const response = await this.#api.getAccountBalance(params.accountId);
    return transformBalance(response);
  }

  async getTransactions(
    params: GetTransactionsRequest,
  ): Promise<GetTransactionsResponse> {
    const response = await this.#api.getTransactions(params);
    return response.transactions.map(transformTransaction);
  }

  async getConnectionStatus({ id }: GetConnectionStatusRequest) {
    if (!id) {
      throw Error("Missing params");
    }

    const response = await this.#api.getSession(id);

    return transformConnectionStatus(response);
  }

  async deleteConnection(params: DeleteConnectionRequest): Promise<void> {
    await this.#api.deleteSession(params.id);
  }

  async deleteAccounts(params: DeleteAccountsRequest): Promise<void> {
    if (params.accountId) {
      await this.#api.deleteSession(params.accountId);
    }
  }
}
