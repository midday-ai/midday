import { bankingCache, CacheTTL } from "@midday/cache/banking-cache";
import { env } from "../../env";
import type {
  GetConnectionStatusRequest,
  GetConnectionStatusResponse,
} from "../../types";
import { ProviderError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { withRateLimitRetry } from "../../utils/retry";
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

  async getHealthCheck() {
    try {
      await fetch(`${this.#baseUrl}/health`);
      return true;
    } catch (_error) {
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
      available_balance: null,
      credit_limit: null,
    };
  }

  async getInstitutions(): Promise<GetInstitutionsResponse> {
    return bankingCache.getOrSet(
      "teller_institutions",
      CacheTTL.TWENTY_FOUR_HOURS,
      () => this.#get<GetInstitutionsResponse>("/institutions"),
    );
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
    } catch (_error) {
      return null;
    }
  }

  async getConnectionStatus({
    accessToken,
  }: GetConnectionStatusRequest): Promise<GetConnectionStatusResponse> {
    try {
      const accounts = await this.#get<{ id: string }[]>(
        "/accounts",
        accessToken,
      );

      if (!Array.isArray(accounts) || accounts.length === 0) {
        return { status: "disconnected" };
      }

      // Teller returns accounts even for inactive enrollments, so probe
      // a single account's transactions to verify the enrollment is healthy.
      await this.#get(
        `/accounts/${accounts[0]!.id}/transactions`,
        accessToken,
        {
          count: 1,
        },
      );

      return { status: "connected" };
    } catch (error) {
      if (error instanceof ProviderError && error.code === "disconnected") {
        return { status: "disconnected" };
      }

      logger.error("Teller connection status check failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      return { status: "connected" };
    }
  }

  async deleteAccounts({
    accessToken,
  }: DisconnectAccountRequest): Promise<void> {
    await this.#fetch(`${this.#baseUrl}/accounts`, {
      method: "delete",
      headers: {
        Authorization: `Basic ${btoa(`${accessToken}:`)}`,
      },
    });
  }

  /**
   * mTLS-authenticated fetch for Teller API.
   * Uses TELLER_CERT_BASE64 and TELLER_KEY_BASE64 for client certificate auth.
   */
  async #fetch(url: string, init?: RequestInit): Promise<Response> {
    const cert = env.TELLER_CERT_BASE64;
    const key = env.TELLER_KEY_BASE64;

    if (!cert || !key) {
      throw new Error(
        "Teller mTLS not configured. Set TELLER_CERT_BASE64 and TELLER_KEY_BASE64.",
      );
    }

    return fetch(url, {
      ...init,
      tls: {
        cert: Buffer.from(cert, "base64").toString(),
        key: Buffer.from(key, "base64").toString(),
      },
    });
  }

  async #get<TResponse>(
    path: string,
    token?: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<TResponse> {
    return withRateLimitRetry(async () => {
      const url = new URL(`${this.#baseUrl}/${path}`);

      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value) {
            url.searchParams.append(key, value.toString());
          }
        }
      }

      const response = await this.#fetch(url.toString(), {
        headers: {
          Authorization: `Basic ${btoa(`${token}:`)}`,
        },
      });

      // Check for rate limit at HTTP level before parsing
      if (response.status === 429) {
        const err = new Error("Rate limited") as any;
        err.status = 429;
        err.headers = Object.fromEntries(response.headers.entries());
        throw err;
      }

      const data = await response.json();
      const error = isError(data);

      if (error) {
        throw new ProviderError(error);
      }

      return data as TResponse;
    });
  }
}
