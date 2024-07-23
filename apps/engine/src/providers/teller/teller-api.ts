import type { ProviderParams } from "../types";
import type {
  AuthenticatedRequest,
  DisconnectAccountRequest,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsResponse,
  GetInstitutionsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
} from "./types";

export class TellerApi {
  #baseUrl = "https://api.teller.io";

  #fetcher: Fetcher;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#fetcher = params.fetcher as Fetcher;
  }

  async getHealthCheck() {
    try {
      await fetch(`${this.#baseUrl}/health`);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async getAccounts({
    accessToken,
  }: AuthenticatedRequest): Promise<GetAccountsResponse> {
    const accounts: GetAccountsResponse = await this.#get(
      "/accounts",
      accessToken,
    );
    return Promise.all(
      accounts?.map(async (account) => {
        const balance = await this.getAccountBalance({
          accountId: account.id,
          accessToken,
        });

        return { ...account, balance };
      }),
    );
  }

  async getTransactions({
    accountId,
    accessToken,
    latest,
    count,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    return this.#get(`/accounts/${accountId}/transactions`, accessToken, {
      count: latest ? 500 : count,
    });
  }

  async getAccountBalance({
    accountId,
    accessToken,
  }: GetAccountBalanceRequest): Promise<GetAccountBalanceResponse> {
    const transactions = await this.getTransactions({
      accountId,
      accessToken,
      count: 2,
    });

    return {
      currency: "USD",
      amount: +(transactions?.at(0)?.running_balance ?? 0),
    };
  }

  async getInstitutions(): Promise<GetInstitutionsResponse> {
    return this.#get("/institutions");
  }

  async deleteAccounts({
    accessToken,
  }: DisconnectAccountRequest): Promise<void> {
    await this.#fetcher.fetch(`${this.#baseUrl}/accounts`, {
      method: "delete",
      headers: new Headers({
        Authorization: `Basic ${btoa(`${accessToken}:`)}`,
      }),
    });
  }

  async #get<TResponse>(
    path: string,
    token?: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<TResponse> {
    const url = new URL(`${this.#baseUrl}/${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          url.searchParams.append(key, value.toString());
        }
      }
    }

    return <TResponse>this.#fetcher
      .fetch(url.toString(), {
        headers: new Headers({
          Authorization: `Basic ${btoa(`${token}:`)}`,
        }),
      })
      .then((response) => response.json())
      .then((data) => data);
  }
}
