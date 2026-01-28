import https from "node:https";
import type { ConnectionStatus } from "../../types";
import { ProviderError } from "../../utils/error";
import type {
  AuthenticatedRequest,
  DisconnectAccountRequest,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountBalancesResponse,
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
  #httpsAgent: https.Agent;

  constructor() {
    // Decode base64 certificate and key from env vars
    const certBase64 = process.env.TELLER_CERT_BASE64;
    const keyBase64 = process.env.TELLER_KEY_BASE64;

    if (!certBase64 || !keyBase64) {
      throw new Error(
        "TELLER_CERT_BASE64 and TELLER_KEY_BASE64 environment variables are required",
      );
    }

    const cert = Buffer.from(certBase64, "base64");
    const key = Buffer.from(keyBase64, "base64");

    this.#httpsAgent = new https.Agent({
      cert,
      key,
      keepAlive: true,
    });
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

        // Fetch full balances for available_balance
        const balances = await this.getAccountBalances({
          accountId: account.id,
          accessToken,
        });

        return { ...account, balance, balances };
      }),
    );
  }

  /**
   * Get full account balances including ledger and available.
   * Returns null if balances are not available.
   */
  async getAccountBalances({
    accountId,
    accessToken,
  }: GetAccountBalanceRequest): Promise<GetAccountBalancesResponse | null> {
    try {
      return await this.#get<GetAccountBalancesResponse>(
        `/accounts/${accountId}/balances`,
        accessToken,
      );
    } catch {
      // Balances endpoint may not be available for all institutions
      return null;
    }
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
  }: {
    accessToken: string;
  }): Promise<ConnectionStatus> {
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
    const url = `${this.#baseUrl}/accounts`;
    const response = await fetch(url, {
      method: "delete",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accessToken}:`).toString("base64")}`,
      },
      // @ts-expect-error - Node.js fetch supports agent
      agent: this.#httpsAgent,
    });

    if (!response.ok) {
      const data = await response.json();
      const error = isError(data);
      if (error) {
        throw new ProviderError(error);
      }
    }
  }

  async #get<TResponse>(
    path: string,
    token?: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<TResponse> {
    const url = new URL(`${this.#baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          url.searchParams.append(key, value.toString());
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`,
      },
      // @ts-expect-error - Node.js fetch supports agent
      agent: this.#httpsAgent,
    });

    const data = await response.json();
    const error = isError(data);

    if (error) {
      throw new ProviderError(error);
    }

    return data as TResponse;
  }
}
