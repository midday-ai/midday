import { bankingCache, CacheTTL } from "@midday/cache/banking-cache";
import { formatISO, subDays } from "date-fns";
import type { XiorInstance, XiorRequestConfig } from "xior";
import xior from "xior";
import { env } from "../../env";
import type { GetInstitutionsRequest } from "../../types";
import { ProviderError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { withRateLimitRetry } from "../../utils/retry";
import type {
  AccountBalance,
  DeleteRequistionResponse,
  GetAccessTokenResponse,
  GetAccountBalanceResponse,
  GetAccountDetailsResponse,
  GetAccountResponse,
  GetAccountsRequest,
  GetAccountsResponse,
  GetInstitutionResponse,
  GetInstitutionsResponse,
  GetRefreshTokenResponse,
  GetRequisitionResponse,
  GetRequisitionsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
  PostCreateAgreementResponse,
  PostEndUserAgreementRequest,
  PostRequisitionsRequest,
  PostRequisitionsResponse,
} from "./types";
import {
  getMaxHistoricalDays,
  parseProviderError,
  selectPrimaryBalance,
} from "./utils";

export class GoCardLessApi {
  #baseUrl = "https://bankaccountdata.gocardless.com";

  #accessTokenCacheKey = "gocardless_access_token";
  #refreshTokenCacheKey = "gocardless_refresh_token";
  #institutionsCacheKey = "gocardless_institutions";
  #institutionCacheKey = "gocardless_institution";
  #requisitionCacheKey = "gocardless_requisition";
  #accountDetailsCacheKey = "gocardless_account_details";
  #accountBalanceCacheKey = "gocardless_account_balance";

  #oneHour = 3600;

  #secretKey;
  #secretId;

  constructor() {
    this.#secretId = env.GOCARDLESS_SECRET_ID;
    this.#secretKey = env.GOCARDLESS_SECRET_KEY;
  }

  async getHealthCheck() {
    try {
      await this.#get("/api/v2/swagger.json");
      return true;
    } catch {
      return false;
    }
  }

  async #getRefreshToken(refresh: string): Promise<string> {
    const response = await this.#post<GetRefreshTokenResponse>(
      "/api/v2/token/refresh/",
      undefined,
      { refresh },
    );

    await bankingCache.set(
      this.#accessTokenCacheKey,
      response.access,
      response.access_expires - this.#oneHour,
    );

    return response.refresh;
  }

  async #getAccessToken(): Promise<string> {
    const [accessToken, refreshToken] = await Promise.all([
      bankingCache.get(this.#accessTokenCacheKey) ?? null,
      bankingCache.get(this.#refreshTokenCacheKey) ?? null,
    ]);

    if (typeof accessToken === "string") {
      return accessToken;
    }

    if (typeof refreshToken === "string") {
      return this.#getRefreshToken(refreshToken);
    }

    const response = await this.#post<GetAccessTokenResponse>(
      "/api/v2/token/new/",
      undefined,
      {
        secret_id: this.#secretId,
        secret_key: this.#secretKey,
      },
    );

    try {
      await Promise.all([
        bankingCache.set(
          this.#accessTokenCacheKey,
          response.access,
          response.access_expires - this.#oneHour,
        ),
        bankingCache.set(
          this.#refreshTokenCacheKey,
          response.refresh,
          response.refresh_expires - this.#oneHour,
        ),
      ]);
    } catch (_error) {
      logger.error("Error saving tokens");
    }

    return response.access;
  }

  async getAccountBalance(
    accountId: string,
  ): Promise<AccountBalance["balanceAmount"] | undefined> {
    const result = await this.getAccountBalances(accountId);
    return result?.primaryBalance?.balanceAmount;
  }

  async getAccountBalances(
    accountId: string,
    preResolvedToken?: string,
  ): Promise<{
    primaryBalance: AccountBalance | undefined;
    balances: GetAccountBalanceResponse["balances"] | undefined;
  }> {
    const cacheKey = `${this.#accountBalanceCacheKey}_${accountId}`;
    const cached = await bankingCache.get(cacheKey);
    if (cached) {
      return cached as {
        primaryBalance: AccountBalance | undefined;
        balances: GetAccountBalanceResponse["balances"] | undefined;
      };
    }

    const token = preResolvedToken ?? (await this.#getAccessToken());

    try {
      const { balances } = await this.#get<GetAccountBalanceResponse>(
        `/api/v2/accounts/${accountId}/balances/`,
        token,
      );

      const result = {
        primaryBalance: selectPrimaryBalance(balances),
        balances,
      };

      bankingCache.set(cacheKey, result, CacheTTL.THIRTY_MINUTES);

      return result;
    } catch (error) {
      const parsedError = parseProviderError(error);

      if (parsedError) {
        throw new ProviderError(parsedError);
      }

      return { primaryBalance: undefined, balances: undefined };
    }
  }

  async getInstitutions(
    params?: GetInstitutionsRequest,
  ): Promise<GetInstitutionsResponse> {
    const countryCode = params?.countryCode;
    const cacheKey = `${this.#institutionsCacheKey}_${countryCode}`;

    const response = await bankingCache.getOrSet<GetInstitutionsResponse>(
      cacheKey,
      CacheTTL.TWENTY_FOUR_HOURS,
      async () => {
        const token = await this.#getAccessToken();

        return this.#get<GetInstitutionsResponse>(
          "/api/v2/institutions/",
          token,
          undefined,
          { params: { country: countryCode } },
        );
      },
    );

    if (countryCode) {
      return response.filter((institution) =>
        institution.countries.includes(countryCode),
      );
    }

    return response;
  }

  async buildLink({
    institutionId,
    agreement,
    redirect,
    reference,
  }: PostRequisitionsRequest): Promise<PostRequisitionsResponse> {
    const token = await this.#getAccessToken();

    return this.#post<PostRequisitionsResponse>(
      "/api/v2/requisitions/",
      token,
      {
        redirect,
        institution_id: institutionId,
        agreement,
        reference,
      },
    );
  }

  async createEndUserAgreement({
    institutionId,
    transactionTotalDays,
  }: PostEndUserAgreementRequest): Promise<PostCreateAgreementResponse> {
    const [token, institution] = await Promise.all([
      this.#getAccessToken(),
      this.getInstitution(institutionId),
    ]);

    const maxHistoricalDays = getMaxHistoricalDays({
      institutionId,
      transactionTotalDays,
      separateContinuousHistoryConsent:
        institution.separate_continuous_history_consent,
    });

    const createAgreement = (accessDays: number) =>
      this.#post<PostCreateAgreementResponse>(
        "/api/v2/agreements/enduser/",
        token,
        {
          institution_id: institutionId,
          access_scope: ["balances", "details", "transactions"],
          access_valid_for_days: accessDays,
          max_historical_days: maxHistoricalDays,
        },
      );

    try {
      return await createAgreement(180);
    } catch (error) {
      const parsed = parseProviderError(error);
      const isClientError = parsed !== false && (parsed.statusCode ?? 0) < 500;

      if (isClientError) {
        return await createAgreement(90);
      }

      throw error;
    }
  }

  async getEndUserAgreement(id: string): Promise<PostCreateAgreementResponse> {
    const cacheKey = `gocardless_agreement_${id}`;

    return bankingCache.getOrSet(cacheKey, CacheTTL.ONE_HOUR, async () => {
      const token = await this.#getAccessToken();

      return this.#get<PostCreateAgreementResponse>(
        `/api/v2/agreements/enduser/${id}/`,
        token,
      );
    });
  }

  async getAccountDetails(
    id: string,
    preResolvedToken?: string,
  ): Promise<GetAccountDetailsResponse> {
    return bankingCache.getOrSet(
      `${this.#accountDetailsCacheKey}_${id}`,
      CacheTTL.THIRTY_MINUTES,
      async () => {
        const token = preResolvedToken ?? (await this.#getAccessToken());

        const [account, details] = await Promise.all([
          this.#get<GetAccountResponse>(`/api/v2/accounts/${id}/`, token),
          this.#get<GetAccountDetailsResponse>(
            `/api/v2/accounts/${id}/details/`,
            token,
          ),
        ]);

        return { ...account, ...details };
      },
    );
  }

  async getInstitution(id: string): Promise<GetInstitutionResponse> {
    return bankingCache.getOrSet(
      `${this.#institutionCacheKey}_${id}`,
      CacheTTL.TWENTY_FOUR_HOURS,
      async () => {
        const token = await this.#getAccessToken();

        return this.#get<GetInstitutionResponse>(
          `/api/v2/institutions/${id}/`,
          token,
        );
      },
    );
  }

  async getAccounts({
    id,
  }: GetAccountsRequest): Promise<GetAccountsResponse | undefined> {
    try {
      // Pre-resolve token once for all sub-requests to avoid repeated Redis lookups
      const token = await this.#getAccessToken();

      const response = await this.getRequestion(id);

      if (!response?.accounts) {
        return undefined;
      }

      // Fetch institution and agreement in parallel — shared across all accounts in this requisition
      const [institution, agreement] = await Promise.all([
        this.getInstitution(response.institution_id),
        this.getEndUserAgreement(response.agreement),
      ]);

      return Promise.all(
        response.accounts.map(async (acountId: string) => {
          const [details, balanceResult] = await Promise.all([
            this.getAccountDetails(acountId, token),
            this.getAccountBalances(acountId, token),
          ]);

          return {
            balance: selectPrimaryBalance(
              balanceResult.balances,
              details.account.currency,
            )?.balanceAmount,
            balances: balanceResult.balances,
            institution,
            accessValidForDays: agreement.access_valid_for_days,
            ...details,
          };
        }),
      );
    } catch (error) {
      const parsedError = parseProviderError(error);

      if (parsedError) {
        throw new ProviderError(parsedError);
      }
    }
  }

  async getTransactions({
    accountId,
    latest,
  }: GetTransactionsRequest): Promise<
    GetTransactionsResponse["transactions"]["booked"] | undefined
  > {
    const token = await this.#getAccessToken();

    try {
      const response = await this.#get<GetTransactionsResponse>(
        `/api/v2/accounts/${accountId}/transactions/`,
        token,
        latest
          ? {
              date_from: formatISO(subDays(new Date(), 5), {
                representation: "date",
              }),
            }
          : undefined,
      );

      return response?.transactions?.booked;
    } catch (error) {
      const parsedError = parseProviderError(error);

      if (parsedError) {
        throw new ProviderError(parsedError);
      }
    }
  }

  async getRequisitions(): Promise<GetRequisitionsResponse> {
    const token = await this.#getAccessToken();

    return this.#get<GetRequisitionsResponse>("/api/v2/requisitions/", token);
  }

  async getRequestion(id: string): Promise<GetRequisitionResponse | undefined> {
    const cacheKey = `${this.#requisitionCacheKey}_${id}`;
    const cached = await bankingCache.get(cacheKey);
    if (cached) {
      return cached as GetRequisitionResponse;
    }

    try {
      const token = await this.#getAccessToken();

      const response = await this.#get<GetRequisitionResponse>(
        `/api/v2/requisitions/${id}/`,
        token,
      );

      bankingCache.set(cacheKey, response, CacheTTL.FIFTEEN_MINUTES);

      return response;
    } catch (error) {
      const parsedError = parseProviderError(error);

      if (parsedError) {
        throw new ProviderError(parsedError);
      }
    }
  }

  async getRequisitionByReference(
    reference: string,
  ): Promise<GetRequisitionResponse | undefined> {
    const token = await this.#getAccessToken();

    const response = await this.#get<GetRequisitionsResponse>(
      "/api/v2/requisitions/",
      token,
    );

    const id = reference.split(":").at(0);

    return response.results?.find((requisition) => {
      return (
        requisition.reference?.split(":").at(0) === id &&
        requisition.status === "LN"
      );
    });
  }

  async deleteRequisition(id: string): Promise<DeleteRequistionResponse> {
    const token = await this.#getAccessToken();

    return this.#_delete<DeleteRequistionResponse>(
      `/api/v2/requisitions/${id}/`,
      token,
    );
  }

  // Cache xior instance per token to reuse HTTP connections
  #cachedApi: XiorInstance | null = null;
  #cachedApiToken: string | undefined;

  async #getApi(accessToken?: string): Promise<XiorInstance> {
    if (this.#cachedApi && this.#cachedApiToken === accessToken) {
      return this.#cachedApi;
    }

    this.#cachedApiToken = accessToken;
    this.#cachedApi = xior.create({
      baseURL: this.#baseUrl,
      timeout: 30_000,
      headers: {
        Accept: "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    return this.#cachedApi;
  }

  async #get<TResponse>(
    path: string,
    token?: string,
    params?: Record<string, string>,
    config?: XiorRequestConfig,
  ): Promise<TResponse> {
    return withRateLimitRetry(async () => {
      const api = await this.#getApi(token);
      return api
        .get<TResponse>(path, { params, ...config })
        .then(({ data }) => data);
    });
  }

  async #post<TResponse>(
    path: string,
    token?: string,
    body?: unknown,
    config?: XiorRequestConfig,
  ): Promise<TResponse> {
    return withRateLimitRetry(async () => {
      const api = await this.#getApi(token);
      return api.post<TResponse>(path, body, config).then(({ data }) => data);
    });
  }

  async #_delete<TResponse>(
    path: string,
    token: string,
    params?: Record<string, string>,
    config?: XiorRequestConfig,
  ): Promise<TResponse> {
    const api = await this.#getApi(token);

    return api
      .delete<TResponse>(path, { params, ...config })
      .then(({ data }) => data);
  }
}
