import type { Provider } from "../interface";
import type {
  DeleteAccountsRequest,
  DeleteConnectionRequest,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsRequest,
  GetAccountsResponse,
  GetConnectionStatusRequest,
  GetInstitutionsRequest,
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

  async getHealthCheck() {
    return this.#api.getHealthCheck();
  }

  async getInstitutions(params: GetInstitutionsRequest) {
    const response = await this.#api.getInstitutions();
    return response.map(transformInstitution);
  }

  async getAccounts({ id }: GetAccountsRequest): Promise<GetAccountsResponse> {
    if (!id) {
      throw Error("Missing params");
    }

    const response = await this.#api.getAccounts({ id });
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

  async deleteConnection(params: DeleteConnectionRequest) {
    await this.#api.deleteSession(params.id);
  }

  async deleteAccounts(params: DeleteAccountsRequest) {
    return;
  }
}
