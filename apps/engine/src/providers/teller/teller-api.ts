import { ProviderError } from "@engine/utils/error";
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
  GetAccountDetailsRequest,
  GetAccountDetailsResponse,
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

  /**
   * Get account balance from transaction running_balance (FREE).
   *
   * Uses running_balance from posted transactions which is included for free
   * with transaction data. Works for both depository and credit account types.
   *
   * Note: If no transactions have running_balance, returns 0. This is rare and
   * only happens with new accounts or some uncommon institutions. If customers
   * report issues, we can add a fallback to the paid /balances endpoint.
   */
  async getAccountBalance({
    accountId,
    accessToken,
  }: GetAccountBalanceRequest): Promise<GetAccountBalanceResponse> {
    const transactions = await this.getTransactions({
      accountId,
      accessToken,
      count: 50,
    });

    const amount = transactions.find(
      (transaction) => transaction.running_balance !== null,
    )?.running_balance;

    return {
      currency: "USD",
      amount: +(amount ?? 0),
      available_balance: null, // Not available without paid /balances endpoint
      credit_limit: null, // Teller doesn't provide credit limit
    };
  }

  async getInstitutions(): Promise<GetInstitutionsResponse> {
    return this.#get("/institutions");
  }

  /**
   * Get account details including routing numbers and account number.
   * Available instantly for most institutions (verify.instant).
   * Some institutions require microdeposit verification (verify.microdeposit).
   * Returns null if account details are not available.
   */
  async getAccountDetails({
    accountId,
    accessToken,
  }: GetAccountDetailsRequest): Promise<GetAccountDetailsResponse | null> {
    try {
      return await this.#get<GetAccountDetailsResponse>(
        `/accounts/${accountId}/details`,
        accessToken,
      );
    } catch (error) {
      // Account details may not be available for all institutions
      // or may require microdeposit verification
      return null;
    }
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
