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
// import { transformAccount, transformTransaction } from "./transform";

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
    // return response.aspsps.map(transformInstitution);
    return [];
  }

  async getAccounts(params: GetAccountsRequest): Promise<GetAccountsResponse> {
    const response = await this.#api.getAccounts(params.id!);
    // return response.accounts.map(transformAccount);
    return [];
  }

  async getAccountBalance(
    params: GetAccountBalanceRequest,
  ): Promise<GetAccountBalanceResponse> {
    const response = await this.#api.getAccountBalance(params.accountId);
    // return transformBalance(response.balances[0]);
    return { currency: "EUR", amount: 100 };
  }

  async getTransactions(
    params: GetTransactionsRequest,
  ): Promise<GetTransactionsResponse> {
    const response = await this.#api.getTransactions(params.accountId);
    return [];
  }

  async getConnectionStatus(
    params: GetConnectionStatusRequest,
  ): Promise<ConnectionStatus> {
    try {
      await this.#api.getAccounts(params.id!);
      return { status: "connected" };
    } catch (error) {
      return { status: "disconnected" };
    }
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
