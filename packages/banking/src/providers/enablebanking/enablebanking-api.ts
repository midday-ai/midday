import { Buffer } from "node:buffer";
import { bankingCache, CacheTTL } from "@midday/cache/banking-cache";
import { formatISO, subDays } from "date-fns";
import * as jose from "jose";
import xior, { type XiorInstance, type XiorRequestConfig } from "xior";
import { env } from "../../env";
import type { GetTransactionsRequest } from "../../types";
import { getProviderErrorDetails, ProviderError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { withRateLimitRetry } from "../../utils/retry";
import { transformSessionData } from "./transform";
import type {
  AuthenticateRequest,
  AuthenticateResponse,
  GetAccountDetailsResponse,
  GetAccountsRequest,
  GetAspspsResponse,
  GetBalancesResponse,
  GetExchangeCodeResponse,
  GetSessionResponse,
  GetTransactionsResponse,
} from "./types";
import { selectPrimaryBalance } from "./utils";

export class EnableBankingApi {
  #baseUrl = "https://api.enablebanking.com";
  #redirectUrl: string;
  #applicationId: string;
  #keyContent: string;

  // Maximum allowed TTL is 24 hours (86400 seconds)
  #expiresIn = 20; // hours

  // Cache JWT and xior client in memory to avoid RSA signing + client creation on every request
  #cachedJwt: string | null = null;
  #cachedJwtExpiresAt = 0;
  #cachedApi: XiorInstance | null = null;

  constructor() {
    this.#applicationId = env.ENABLEBANKING_APPLICATION_ID;
    this.#keyContent = env.ENABLE_BANKING_KEY_CONTENT;
    this.#redirectUrl = env.ENABLEBANKING_REDIRECT_URL;
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
        privateKey,
        new TextEncoder().encode(data),
      );

      return jose.base64url.encode(new Uint8Array(signature));
    } catch (error) {
      logger.error(
        "EnableBanking JWT signing failed",
        getProviderErrorDetails(error),
      );
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

  async #getJwt(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    // Reuse cached JWT if it has at least 5 minutes of validity left
    if (this.#cachedJwt && this.#cachedJwtExpiresAt > now + 300) {
      return this.#cachedJwt;
    }

    const jwt = await this.#generateJWT();
    this.#cachedJwt = jwt;
    this.#cachedJwtExpiresAt = now + this.#expiresIn * 60 * 60;
    return jwt;
  }

  async #getApi(): Promise<XiorInstance> {
    const jwt = await this.#getJwt();

    // Reuse the xior instance if the JWT hasn't changed
    if (this.#cachedApi && this.#cachedJwt === jwt) {
      return this.#cachedApi;
    }

    this.#cachedApi = xior.create({
      baseURL: this.#baseUrl,
      timeout: 30_000,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwt}`,
      },
    });

    return this.#cachedApi;
  }

  async #get<TResponse>(
    path: string,
    params?: Record<string, string>,
    config?: XiorRequestConfig,
  ): Promise<TResponse> {
    return withRateLimitRetry(async () => {
      const api = await this.#getApi();

      return api
        .get<TResponse>(path, {
          params,
          ...config,
          headers: {
            ...config?.headers,
            "Psu-Ip-Address": Array.from(
              { length: 4 },
              () => ~~(Math.random() * 256),
            ).join("."),
            "Psu-User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        })
        .then(({ data }) => data);
    });
  }

  async #post<TResponse>(
    path: string,
    body?: unknown,
    config?: XiorRequestConfig,
  ): Promise<TResponse> {
    return withRateLimitRetry(async () => {
      const api = await this.#getApi();

      return api.post<TResponse>(path, body, config).then(({ data }) => data);
    });
  }

  async authenticate(
    params: AuthenticateRequest,
  ): Promise<AuthenticateResponse> {
    const { country, institutionName, teamId, validUntil, state, type } =
      params;

    try {
      const response = await this.#post<AuthenticateResponse>("/auth", {
        access: {
          balances: true,
          transactions: true,
          valid_until: validUntil,
        },
        aspsp: {
          name: institutionName,
          country,
        },
        psu_type: type,
        psu_id: teamId,
        redirect_url: this.#redirectUrl,
        state,
      });

      return response;
    } catch (error) {
      logger.error(
        "EnableBanking authentication failed",
        getProviderErrorDetails(error),
      );
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
      logger.error(
        "EnableBanking code exchange failed",
        getProviderErrorDetails(error),
      );
      throw new ProviderError({
        message: "Failed to exchange code",
        // @ts-expect-error
        code: error.response?.data?.error ?? "ENABLEBANKING_ERROR",
      });
    }
  }

  async getSession(sessionId: string): Promise<GetSessionResponse> {
    return bankingCache.getOrSet(
      `enablebanking_session_${sessionId}`,
      CacheTTL.FIFTEEN_MINUTES,
      () => this.#get<GetSessionResponse>(`/sessions/${sessionId}`),
    );
  }

  async getHealthCheck(): Promise<boolean> {
    try {
      await this.#get<{ message: string }>("/application");
      return true;
    } catch (_error) {
      return false;
    }
  }

  async getInstitutions(): Promise<GetAspspsResponse["aspsps"]> {
    return bankingCache.getOrSet(
      "enablebanking_institutions",
      CacheTTL.TWENTY_FOUR_HOURS,
      async () => {
        const response = await this.#get<GetAspspsResponse>("/aspsps");
        return response.aspsps;
      },
    );
  }

  async getAccountDetails(
    accountId: string,
  ): Promise<GetAccountDetailsResponse> {
    return bankingCache.getOrSet(
      `enablebanking_account_details_${accountId}`,
      CacheTTL.THIRTY_MINUTES,
      () =>
        this.#get<GetAccountDetailsResponse>(`/accounts/${accountId}/details`),
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

          const balance = selectPrimaryBalance(
            balanceResponse.balances,
            details.currency,
          );

          return {
            ...details,
            institution: session.aspsp,
            valid_until: session.access.valid_until,
            balance: balance!,
          };
        }),
      );

      return accountDetails;
    } catch (error) {
      logger.error(
        "EnableBanking getAccounts failed",
        getProviderErrorDetails(error),
      );
      throw error;
    }
  }

  async getAccountBalance(accountId: string): Promise<{
    balance: GetBalancesResponse["balances"][0];
    balances: GetBalancesResponse["balances"];
    creditLimit?: { currency: string; amount: string } | null;
  }> {
    // Fetch both balance and account details (for credit_limit)
    const [balanceResponse, accountDetails] = await Promise.all([
      this.#get<GetBalancesResponse>(`/accounts/${accountId}/balances`),
      this.getAccountDetails(accountId).catch(() => null),
    ]);

    const primaryBalance = selectPrimaryBalance(
      balanceResponse.balances,
      accountDetails?.currency,
    );

    return {
      balance: primaryBalance!,
      balances: balanceResponse.balances,
      creditLimit: accountDetails?.credit_limit,
    };
  }

  /**
   * Get transactions for an account using a hybrid strategy to ensure complete data coverage.
   *
   * Enable Banking Strategies (per official documentation):
   * - "longest": Finds earliest available transaction and fetches up to most recent.
   *   Ignores date_to. Recommended for initial sync or fetching complete history.
   * - "default": Respects date_from/date_to range. Returns error if range unavailable.
   *   Recommended for ongoing syncs of recent transactions.
   *
   * Pagination (continuation_key):
   * - All parameters must remain consistent across paginated requests
   * - Continue fetching until continuation_key is null
   * - Empty transaction lists with continuation_key mean more data may be available
   * - Page size varies by ASPSP and account
   *
   * Implementation for latest=false (historical sync):
   * 1. Use "longest" strategy with date_from constraint (2 years back) + pagination
   * 2. Check if most recent transaction is older than 7 days (stale data detection)
   * 3. If stale, fetch last 365 days using "default" strategy + pagination and merge
   *
   * Why hybrid approach is necessary:
   * Testing shows that "longest" strategy may return cached/stale data for some ASPSPs
   * (e.g., Wise). The "default" strategy with explicit date_to forces fresh data retrieval.
   *
   * Duplicate Handling:
   * - Historical and recent datasets may overlap (e.g., transactions from Oct-Dec 2024)
   * - API layer returns ALL transactions including potential duplicates
   * - Database layer MUST implement Enable Banking's full deduplication algorithm
   *
   * Enable Banking's recommended approach (to be implemented in database layer):
   * 1. Try matching by internal_id (entry_reference) first
   * 2. If no match, search by composite key: booking_date + amount + credit_debit_indicator
   * 3. If multiple matches, use fuzzy matching with additional fields
   * 4. Handle edge cases (unexpected internal_id values, property changes)
   * Reference: https://enablebanking.com/blog/2024/10/29/how-to-sync-account-transactions-from-open-banking-apis-without-unique-transaction-ids
   *
   * Note: Transaction history availability varies by ASPSP and account type. No universal
   * guarantees exist for how far back data is available.
   */
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
      // Note: Must keep ALL parameters consistent when using continuation_key
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

          // Merge recent data with historical data
          // Note: This will include overlapping transactions (duplicates)
          // Database layer will handle deduplication using Enable Banking's full algorithm
          // Reference: https://enablebanking.com/blog/2024/10/29/how-to-sync-account-transactions-from-open-banking-apis-without-unique-transaction-ids
          allTransactions = allTransactions.concat(recentResponse.transactions);
          recentContinuationKey = recentResponse.continuation_key;
        } while (recentContinuationKey);
      }
    } catch (error) {
      // Fallback: If longest strategy fails, use default with 1-year range
      logger.warn(
        "EnableBanking longest strategy failed, using default fallback",
        { error: error instanceof Error ? error.message : String(error) },
      );

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
    const api = await this.#getApi();
    await api.delete(`/sessions/${sessionId}`);
  }
}
