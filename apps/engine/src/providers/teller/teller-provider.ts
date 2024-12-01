import type { Provider } from "../interface";
import type {
  DeleteAccountsRequest,
  DeleteConnectionRequest,
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetConnectionStatusRequest,
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

  async getConnectionStatus({ accessToken }: GetConnectionStatusRequest) {
    if (!accessToken) {
      throw Error("accessToken missing");
    }

    const response = await this.#api.getConnectionStatus({ accessToken });

    return response;
  }

  async deleteConnection({ accessToken }: DeleteConnectionRequest) {
    if (!accessToken) {
      throw Error("accessToken missing");
    }

    await this.#api.deleteAccounts({ accessToken });
  }
}
