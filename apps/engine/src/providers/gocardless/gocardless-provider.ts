import type { Provider } from "../interface";
import type {
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetTransactionsRequest,
  ProviderParams,
} from "../types";
import { GoCardLessApi } from "./gocardless-api";
import {
  transformAccount,
  transformAccountBalance,
  transformTransaction,
} from "./transform";

export class GoCardLessProvider implements Provider {
  #api: GoCardLessApi;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#api = new GoCardLessApi(params);
  }

  async getHealthCheck() {
    return this.#api.getHealthCheck();
  }

  async getTransactions({ accountId, latest }: GetTransactionsRequest) {
    const response = await this.#api.getTransactions({
      latest,
      accountId,
    });

    return response.map(transformTransaction);
  }

  async getAccounts({ id, countryCode }: GetAccountsRequest) {
    if (!countryCode || !id) {
      throw Error("Missing params");
    }

    const response = await this.#api.getAccounts({
      id,
      countryCode,
    });

    return response.map(transformAccount);
  }

  async getAccountBalance({ accountId }: GetAccountBalanceRequest) {
    if (!accountId) {
      throw Error("Missing params");
    }

    const response = await this.#api.getAccountBalance(accountId);

    return transformAccountBalance(response);
  }

  async getInstitutions() {
    return Promise.resolve([]);
  }
}
