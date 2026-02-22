import type { Provider } from "../../interface";
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
} from "../../types";
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

  constructor() {
    this.#api = new EnableBankingApi();
  }

  async getHealthCheck() {
    return this.#api.getHealthCheck();
  }

  async getInstitutions(_params: GetInstitutionsRequest) {
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

    return transformBalance({
      balance: response.balance,
      balances: response.balances,
      creditLimit: response.creditLimit,
      accountType: params.accountType,
    });
  }

  async getTransactions(
    params: GetTransactionsRequest,
  ): Promise<GetTransactionsResponse> {
    const response = await this.#api.getTransactions(params);
    return response.transactions.map((transaction) =>
      transformTransaction({
        transaction,
        accountType: params.accountType,
      }),
    );
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

  async deleteAccounts(_params: DeleteAccountsRequest) {
    return;
  }
}
