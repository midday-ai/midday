import type { Provider } from "../interface";
import type {
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetTransactionsRequest,
} from "../types";
import { PlaidApi } from "./plaid-api";
import {
  transformAccount,
  transformAccountBalance,
  transformTransaction,
} from "./transform";

export class PlaidProvider implements Provider {
  #api: PlaidApi;

  constructor() {
    this.#api = new PlaidApi();
  }

  async getTransactions({
    accessToken,
    accountId,
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

    return response.map(transformTransaction);
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

    return response?.map(transformAccount);
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
}
