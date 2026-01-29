import { CACHE_TTL, bankingCache } from "../../cache";
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
  Institution,
} from "../../types";
import type { Provider } from "../interface";
import { EnableBankingApi } from "./api";
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

  async getInstitutions(params: GetInstitutionsRequest) {
    const cacheKey = params?.countryCode || "all";

    // Check cache first
    const cached = await bankingCache.getKeyed<Institution[]>(
      "enablebanking",
      "institutions",
      cacheKey,
    );

    if (cached) {
      return cached;
    }

    const response = await this.#api.getInstitutions();
    const institutions = response.map(transformInstitution);

    // Cache all institutions, then filter by country if needed
    await bankingCache.setKeyed(
      "enablebanking",
      "institutions",
      "all",
      institutions,
      CACHE_TTL.INSTITUTIONS,
    );

    // If country code is specified, filter and cache that too
    if (params?.countryCode) {
      const countryCode = params.countryCode.toLowerCase();
      const filtered = institutions.filter((inst) =>
        // EnableBanking institutions have country in the name or ID
        inst.id.includes(countryCode),
      );

      await bankingCache.setKeyed(
        "enablebanking",
        "institutions",
        cacheKey,
        filtered,
        CACHE_TTL.INSTITUTIONS,
      );

      return filtered;
    }

    return institutions;
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
      creditLimit: response.creditLimit,
      accountType: params.accountType,
    });
  }

  async getTransactions(
    params: GetTransactionsRequest,
  ): Promise<GetTransactionsResponse> {
    const response = await this.#api.getTransactions({
      accountId: params.accountId,
      latest: params.latest ?? false,
    });
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

  async deleteAccounts(params: DeleteAccountsRequest) {
    return;
  }
}
