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
import { GoCardLessApi } from "./gocardless-api";
import {
  transformAccount,
  transformAccountBalance,
  transformConnectionStatus,
  transformInstitution,
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

    return (response ?? []).map(transformTransaction);
  }

  async getAccounts({ id }: GetAccountsRequest) {
    if (!id) {
      throw Error("Missing params");
    }

    const response = await this.#api.getAccounts({ id });

    return (response ?? []).map(transformAccount);
  }

  async getAccountBalance({ accountId }: GetAccountBalanceRequest) {
    if (!accountId) {
      throw Error("Missing params");
    }

    const response = await this.#api.getAccountBalance(accountId);

    return transformAccountBalance(response);
  }

  async getInstitutions({ countryCode }: GetInstitutionsRequest) {
    if (!countryCode) {
      throw Error("Missing countryCode");
    }

    const response = await this.#api.getInstitutions({ countryCode });

    return response.map(transformInstitution);
  }

  async deleteAccounts({ accountId }: DeleteAccountsRequest) {
    if (!accountId) {
      throw Error("Missing params");
    }

    await this.#api.deleteRequisition(accountId);
  }

  async getConnectionStatus({ id }: GetConnectionStatusRequest) {
    if (!id) {
      throw Error("Missing params");
    }

    const response = await this.#api.getRequestion(id);

    return transformConnectionStatus(response);
  }

  async deleteConnection({ id }: DeleteConnectionRequest) {
    if (!id) {
      throw Error("Missing params");
    }

    await this.#api.deleteRequisition(id);
  }
}
