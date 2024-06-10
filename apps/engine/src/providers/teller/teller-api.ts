import type { ProviderParams } from "../types";
import type {
  AuthenticatedRequest,
  DeleteAccountRequest,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
} from "./types";

export class TellerApi {
  #baseUrl = "https://api.teller.io";

  #fetcher: Fetcher;

  constructor(params: ProviderParams) {
    this.#fetcher = params.fetcher;
  }

  async getHealthcheck() {
    try {
      await this.#get("/health");
      return true;
    } catch {
      return false;
    }
  }

  async getAccounts({
    accessToken,
  }: AuthenticatedRequest): Promise<GetAccountsResponse> {
    return this.#get("/accounts", accessToken);
  }

  async getTransactions({
    accountId,
    accessToken,
    latest,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    return this.#get(
      `/accounts/${accountId}/transactions`,
      accessToken,
      latest
        ? {
            count: 500,
          }
        : undefined
    );
  }

  async getAccountBalance({
    accountId,
    accessToken,
  }: GetAccountBalanceRequest): Promise<GetAccountBalanceResponse> {
    const transactions = await this.#get(
      `/accounts/${accountId}/transactions`,
      accessToken,
      {
        count: 1,
      }
    );

    return {
      currency: "USD",
      amount: +(transactions?.at(0)?.running_balance ?? 0),
    };
  }

  async deleteAccount({
    accountId,
    accessToken,
  }: DeleteAccountRequest): Promise<void> {
    await this.#fetcher.fetch(`${this.#baseUrl}/accounts/${accountId}`, {
      method: "delete",
      headers: new Headers({
        Authorization: `Basic ${btoa(`${accessToken}:`)}`,
      }),
    });
  }

  async #get<TResponse>(
    path: string,
    token?: string,
    params?: Record<string, string | number>
  ): Promise<TResponse> {
    const url = new URL(`${this.#baseUrl}/${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value.toString());
      }
    }

    return this.#fetcher
      .fetch(url.toString(), {
        headers: new Headers({
          Authorization: `Basic ${btoa(`${token}:`)}`,
        }),
      })
      .then((response) => response.json())
      .then((data) => data);
  }
}
