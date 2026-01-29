import { Buffer } from "node:buffer";
import { createLoggerWithContext } from "@midday/logger";
import { formatISO, subDays } from "date-fns";
import * as jose from "jose";
import { ProviderError } from "../../utils/error";
import { transformSessionData } from "./transform";

const logger = createLoggerWithContext("enablebanking");
import type {
  AuthenticateRequest,
  AuthenticateResponse,
  GetAccountDetailsResponse,
  GetAccountsRequest,
  GetAspspsResponse,
  GetBalancesResponse,
  GetExchangeCodeResponse,
  GetSessionResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
} from "./types";

export class EnableBankingApi {
  #baseUrl = "https://api.enablebanking.com";
  #redirectUrl: string;
  #applicationId: string;
  #keyContent: string;
  #timeout = 30_000;

  // Maximum allowed TTL is 24 hours (86400 seconds)
  #expiresIn = 20; // hours

  constructor() {
    this.#applicationId = process.env.ENABLEBANKING_APPLICATION_ID!;
    this.#keyContent = process.env.ENABLE_BANKING_KEY_CONTENT!;
    this.#redirectUrl = process.env.ENABLEBANKING_REDIRECT_URL!;
  }

  #encodeData(data: object) {
    return jose.base64url.encode(Buffer.from(JSON.stringify(data)));
  }

  #getJWTHeader() {
    return this.#encodeData({
      typ: "JWT",
      alg: "RS256",
      kid: this.#applicationId,
    });
  }

  #getJWTBody(exp: number) {
    const timestamp = Math.floor(Date.now() / 1000);
    return this.#encodeData({
      iss: "enablebanking.com",
      aud: "api.enablebanking.com",
      iat: timestamp,
      exp: timestamp + exp,
    });
  }

  async #signWithKey(data: string) {
    try {
      const keyBuffer = Buffer.from(this.#keyContent, "base64");
      const pemKey = keyBuffer.toString("utf8");

      const privateKey = await jose.importPKCS8(pemKey, "RS256");

      const signature = await crypto.subtle.sign(
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-256" },
        },
        // @ts-ignore
        privateKey,
        new TextEncoder().encode(data),
      );

      return jose.base64url.encode(new Uint8Array(signature));
    } catch (error) {
      logger.error("Error in JWT signing", { error });
      throw error;
    }
  }

  async #generateJWT() {
    const exp = this.#expiresIn * 60 * 60;
    const jwtHeaders = this.#getJWTHeader();
    const jwtBody = this.#getJWTBody(exp);
    const jwtSignature = await this.#signWithKey(`${jwtHeaders}.${jwtBody}`);

    return `${jwtHeaders}.${jwtBody}.${jwtSignature}`;
  }

  #buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(path, this.#baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }

  async #getHeaders(): Promise<Record<string, string>> {
    const jwt = await this.#generateJWT();
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    };
  }

  async #get<TResponse>(
    path: string,
    params?: Record<string, string>,
  ): Promise<TResponse> {
    const url = this.#buildUrl(path, params);
    const headers = await this.#getHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...headers,
          "Psu-Ip-Address": Array.from(
            { length: 4 },
            () => ~~(Math.random() * 256),
          ).join("."),
          "Psu-User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw { response: { data: error, status: response.status } };
      }

      return response.json() as Promise<TResponse>;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async #post<TResponse>(
    path: string,
    body?: unknown,
  ): Promise<TResponse> {
    const url = this.#buildUrl(path);
    const headers = await this.#getHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw { response: { data: error, status: response.status } };
      }

      return response.json() as Promise<TResponse>;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async authenticate(
    params: AuthenticateRequest,
  ): Promise<AuthenticateResponse> {
    const { country, institutionId, teamId, validUntil, state, type } = params;

    try {
      const response = await this.#post<AuthenticateResponse>("/auth", {
        access: {
          balances: true,
          transactions: true,
          valid_until: validUntil,
        },
        aspsp: {
          name: institutionId,
          country,
        },
        psu_type: type,
        psu_id: teamId,
        redirect_url: this.#redirectUrl,
        state,
      });

      return response;
    } catch (error) {
      logger.error("Failed to authenticate with EnableBanking", { error });
      throw error;
    }
  }

  async exchangeCode(code: string) {
    try {
      const response = await this.#post<GetExchangeCodeResponse>("/sessions", {
        code,
      });

      return transformSessionData(response);
    } catch (error) {
      logger.error("Failed to exchange EnableBanking code", { error });
      throw new ProviderError({
        message: "Failed to exchange code",
        // @ts-ignore
        code: error.response?.data?.error ?? "ENABLEBANKING_ERROR",
      });
    }
  }

  async getSession(sessionId: string): Promise<GetSessionResponse> {
    return this.#get<GetSessionResponse>(`/sessions/${sessionId}`);
  }

  async getHealthCheck(): Promise<boolean> {
    try {
      await this.#get<{ message: string }>("/application");
      return true;
    } catch (error) {
      return false;
    }
  }

  async getInstitutions(): Promise<GetAspspsResponse["aspsps"]> {
    const response = await this.#get<GetAspspsResponse>("/aspsps");

    return response.aspsps;
  }

  async getAccountDetails(
    accountId: string,
  ): Promise<GetAccountDetailsResponse> {
    return this.#get<GetAccountDetailsResponse>(
      `/accounts/${accountId}/details`,
    );
  }

  async getAccounts({
    id,
  }: GetAccountsRequest): Promise<GetAccountDetailsResponse[]> {
    try {
      const session = await this.getSession(id);

      const accountDetails = await Promise.all(
        session.accounts.map(async (id) => {
          const [details, balanceResponse] = await Promise.all([
            this.getAccountDetails(id),
            this.#get<GetBalancesResponse>(`/accounts/${id}/balances`),
          ]);

          // Find balance with highest amount
          const balances = balanceResponse.balances;
          const balance = balances.length > 0
            ? balances.reduce((max, current) => {
                const currentAmount = +current.balance_amount.amount;
                const maxAmount = +max.balance_amount.amount;
                return currentAmount > maxAmount ? current : max;
              })
            : {
                name: "",
                balance_amount: { currency: details.currency, amount: "0" },
                balance_type: "unknown",
                last_change_date_time: "",
                reference_date: "",
                last_committed_transaction: "",
              };

          return {
            ...details,
            institution: session.aspsp,
            valid_until: session.access.valid_until,
            balance,
          };
        }),
      );

      return accountDetails;
    } catch (error) {
      logger.error("Failed to get EnableBanking accounts", { error });
      throw error;
    }
  }

  async getAccountBalance(accountId: string): Promise<{
    balance: GetBalancesResponse["balances"][0];
    creditLimit?: { currency: string; amount: string } | null;
  }> {
    // Fetch both balance and account details (for credit_limit)
    const [balanceResponse, accountDetails] = await Promise.all([
      this.#get<GetBalancesResponse>(`/accounts/${accountId}/balances`),
      this.getAccountDetails(accountId).catch(() => null),
    ]);

    // Find balance with highest amount
    const balances = balanceResponse.balances;
    const highestBalance = balances.length > 0
      ? balances.reduce((max, current) => {
          const currentAmount = +current.balance_amount.amount;
          const maxAmount = +max.balance_amount.amount;
          return currentAmount > maxAmount ? current : max;
        })
      : {
          name: "",
          balance_amount: { currency: "USD", amount: "0" },
          balance_type: "unknown",
          last_change_date_time: "",
          reference_date: "",
          last_committed_transaction: "",
        };

    return {
      balance: highestBalance,
      creditLimit: accountDetails?.credit_limit,
    };
  }

  async getTransactions({
    accountId,
    latest,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    let allTransactions: GetTransactionsResponse["transactions"] = [];
    let continuationKey: string | undefined;

    // For latest requests, use incremental sync
    if (latest) {
      // last 5 days
      const startDate = formatISO(subDays(new Date(), 5), {
        representation: "date",
      });
      const endDate = formatISO(new Date(), {
        representation: "date",
      });

      do {
        const response = await this.#get<GetTransactionsResponse>(
          `/accounts/${accountId}/transactions`,
          {
            strategy: "default",
            transaction_status: "BOOK",
            date_from: startDate,
            date_to: endDate,
            ...(continuationKey && { continuation_key: continuationKey }),
          },
        );

        allTransactions = allTransactions.concat(response.transactions);
        continuationKey = response.continuation_key;
      } while (continuationKey);

      // Sort transactions by date, latest first
      allTransactions.sort((a, b) => {
        const dateA = a.booking_date || a.value_date || "";
        const dateB = b.booking_date || b.value_date || "";
        return dateB.localeCompare(dateA); // Descending order (latest first)
      });

      return { transactions: allTransactions };
    }

    // For non-latest requests, use hybrid strategy
    try {
      // Step 1: Get historical data using "longest" strategy with pagination
      const longestParams = {
        strategy: "longest" as const,
        transaction_status: "BOOK" as const,
        date_from: formatISO(subDays(new Date(), 730), {
          representation: "date",
        }),
      };

      let longestContinuationKey: string | undefined;
      do {
        const response = await this.#get<GetTransactionsResponse>(
          `/accounts/${accountId}/transactions`,
          {
            ...longestParams,
            ...(longestContinuationKey && {
              continuation_key: longestContinuationKey,
            }),
          },
        );

        allTransactions = allTransactions.concat(response.transactions);
        longestContinuationKey = response.continuation_key;
      } while (longestContinuationKey);

      // Step 2: Check if we have recent data (within last 7 days)
      const sevenDaysAgo = formatISO(subDays(new Date(), 7), {
        representation: "date",
      });
      const mostRecentDate = allTransactions
        .map((t) => t.booking_date || t.value_date)
        .filter(Boolean)
        .sort()
        .pop();

      // Step 3: If data is stale, fetch recent data and merge with pagination
      if (!mostRecentDate || mostRecentDate < sevenDaysAgo) {
        const recentStartDate = formatISO(subDays(new Date(), 365), {
          representation: "date",
        });
        const recentEndDate = formatISO(new Date(), {
          representation: "date",
        });

        let recentContinuationKey: string | undefined;
        do {
          const recentResponse = await this.#get<GetTransactionsResponse>(
            `/accounts/${accountId}/transactions`,
            {
              strategy: "default",
              transaction_status: "BOOK",
              date_from: recentStartDate,
              date_to: recentEndDate,
              ...(recentContinuationKey && {
                continuation_key: recentContinuationKey,
              }),
            },
          );

          allTransactions = allTransactions.concat(recentResponse.transactions);
          recentContinuationKey = recentResponse.continuation_key;
        } while (recentContinuationKey);
      }
    } catch (error) {
      // Fallback: If longest strategy fails, use default with 1-year range
      logger.warn("Longest strategy failed, using default fallback", { error });

      // Reset transactions array to avoid mixing data from failed attempt
      allTransactions = [];
      continuationKey = undefined;

      const fallbackStartDate = formatISO(subDays(new Date(), 365), {
        representation: "date",
      });
      const fallbackEndDate = formatISO(new Date(), {
        representation: "date",
      });

      let fallbackResponse: GetTransactionsResponse;
      do {
        fallbackResponse = await this.#get<GetTransactionsResponse>(
          `/accounts/${accountId}/transactions`,
          {
            strategy: "default",
            transaction_status: "BOOK",
            date_from: fallbackStartDate,
            date_to: fallbackEndDate,
            ...(continuationKey && { continuation_key: continuationKey }),
          },
        );

        allTransactions = allTransactions.concat(fallbackResponse.transactions);
        continuationKey = fallbackResponse.continuation_key;
      } while (continuationKey);
    }

    // Sort transactions by date, latest first
    allTransactions.sort((a, b) => {
      const dateA = a.booking_date || a.value_date || "";
      const dateB = b.booking_date || b.value_date || "";
      return dateB.localeCompare(dateA); // Descending order (latest first)
    });

    return {
      transactions: allTransactions,
    };
  }

  async deleteSession(sessionId: string): Promise<void> {
    const url = this.#buildUrl(`/sessions/${sessionId}`);
    const headers = await this.#getHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw { response: { data: error, status: response.status } };
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
