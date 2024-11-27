import { ProviderError } from "@/utils/error";
import type {
  GetConnectionStatusRequest,
  GetConnectionStatusResponse,
  ProviderParams,
} from "../types";
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
import { isError } from "./utils";

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
    const result = await this.#get<GetTransactionsResponse>(
      `/accounts/${accountId}/transactions`,
      accessToken,
      {
        count: latest ? 100 : count,
      },
    );

    // NOTE: Remove pending transactions until upsert issue is fixed
    return result.filter((transaction) => transaction.status !== "pending");
  }

  async getAccountBalance({
    accountId,
    accessToken,
  }: GetAccountBalanceRequest): Promise<GetAccountBalanceResponse> {
    const transactions = await this.getTransactions({
      accountId,
      accessToken,
      count: 20,
    });

    const amount = transactions.find(
      (transaction) => transaction.running_balance !== null,
    )?.running_balance;

    return {
      currency: "USD",
      amount: +(amount ?? 0),
    };
  }

  async getInstitutions(): Promise<GetInstitutionsResponse> {
    return this.#get("/institutions");
  }

  async getConnectionStatus({
    accessToken,
  }: GetConnectionStatusRequest): Promise<GetConnectionStatusResponse> {
    try {
      const accounts = await this.#get("/accounts", accessToken);

      if (!Array.isArray(accounts)) {
        return { status: "disconnected" };
      }

      // If we can fetch any accounts, the connection is active
      // Check all accounts in parallel
      const results = await Promise.allSettled(
        accounts.map((account) =>
          this.#get(`/accounts/${account.id}`, accessToken),
        ),
      );

      // If any account request succeeded, connection is valid
      if (results.some((result) => result.status === "fulfilled")) {
        return { status: "connected" };
      }

      // If we couldn't verify any accounts, assume disconnected
      return { status: "disconnected" };
    } catch (error) {
      const parsedError = isError(error);

      if (parsedError) {
        const providerError = new ProviderError(parsedError);

        if (providerError.code === "disconnected") {
          return { status: "disconnected" };
        }
      }
    }

    // If we get here, the account is not disconnected
    // But it could be a connection issue between Teller and the institution
    return { status: "connected" };
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
      .then((data) => {
        const error = isError(data);

        if (error) {
          throw new ProviderError(error);
        }

        return data as TResponse;
      });
  }
}
