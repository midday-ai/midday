import type { Provider } from "../interface";
import type {
  DeleteAccountsRequest,
  DeleteConnectionRequest,
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetConnectionStatusRequest,
  GetInstitutionsRequest,
  GetTransactionsRequest,
  ProviderParams,
} from "../types";
import { PluggyApi } from "./pluggy-api";
import {
  transformAccount,
  transformBalance,
  transformInstitution,
  transformTransaction,
} from "./transform";

export class PluggyProvider implements Provider {
  #api: PluggyApi;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#api = new PluggyApi(params);
  }

  async getTransactions({ accountId, latest }: GetTransactionsRequest) {
    if (!accountId) {
      throw Error("accountId is missing");
    }

    const response = await this.#api.getTransactions({
      accountId,
      latest,
    });

    return (response ?? []).map(transformTransaction);
  }

  async getHealthCheck() {
    return this.#api.getHealthCheck();
  }

  async getAccounts({ id, institutionId }: GetAccountsRequest) {
    if (!id || !institutionId) {
      throw Error("id or institutionId is missing");
    }

    const response = await this.#api.getAccounts({
      id,
      institutionId,
    });

    return (response ?? []).map(transformAccount);
  }

  async getAccountBalance({ accountId }: GetAccountBalanceRequest) {
    if (!accountId) {
      throw Error("accountId is missing");
    }

    const response = await this.#api.getAccountBalance(accountId);

    if (!response) {
      throw Error("Account not found");
    }

    return transformBalance(response);
  }

  async getInstitutions({ countryCode }: GetInstitutionsRequest) {
    if (!countryCode) {
      throw Error("countryCode is missing");
    }

    const response = await this.#api.getInstitutions({
      countries: [countryCode],
    });

    return response.map(transformInstitution);
  }

  async deleteAccounts({ accessToken }: DeleteAccountsRequest) {
    if (!accessToken) {
      throw Error("accessToken is missing");
    }

    return;
  }

  async getConnectionStatus({ accessToken }: GetConnectionStatusRequest) {
    if (!accessToken) {
      throw Error("accessToken is missing");
    }

    return null;
  }

  async deleteConnection({ accessToken }: DeleteConnectionRequest) {
    if (!accessToken) {
      throw Error("accessToken is missing");
    }
  }
}
