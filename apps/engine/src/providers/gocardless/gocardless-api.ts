import { CACHE_TTL, withCache } from "@engine/utils/cache";
import { ProviderError } from "@engine/utils/error";
import { logger } from "@engine/utils/logger";
import { formatISO, subDays } from "date-fns";
import xior from "xior";
import type { XiorInstance, XiorRequestConfig } from "xior";
import type { GetInstitutionsRequest, ProviderParams } from "../types";
import type {
  DeleteRequistionResponse,
  GetAccessTokenResponse,
  GetAccountBalanceResponse,
  GetAccountDetailsResponse,
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
import { getAccessValidForDays, getMaxHistoricalDays, isError } from "./utils";

export class GoCardLessApi {
  #baseUrl = "https://bankaccountdata.gocardless.com";

  // Cache keys
  #accessTokenCacheKey = "gocardless_access_token";
  #refreshTokenCacheKey = "gocardless_refresh_token";
  #institutionsCacheKey = "gocardless_institutions";
  #accountsCacheKeyPrefix = "gocardless_accounts";

  #kv: KVNamespace;

  #secretKey;
  #secretId;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#kv = params.kv;
    this.#secretId = params.envs.GOCARDLESS_SECRET_ID;
    this.#secretKey = params.envs.GOCARDLESS_SECRET_KEY;
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
      {
        refresh,
      },
    );

    await this.#kv?.put(this.#accessTokenCacheKey, response.access, {
      expirationTtl: response.access_expires - CACHE_TTL.ONE_HOUR,
    });

    return response.refresh;
  }

  async #getAccessToken(): Promise<string> {
    const [accessToken, refreshToken] = await Promise.all([
      this.#kv?.get(this.#accessTokenCacheKey),
      this.#kv?.get(this.#refreshTokenCacheKey),
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
        this.#kv?.put(this.#accessTokenCacheKey, response.access, {
          expirationTtl: response.access_expires - CACHE_TTL.ONE_HOUR,
        }),
        this.#kv?.put(this.#refreshTokenCacheKey, response.refresh, {
          expirationTtl: response.refresh_expires - CACHE_TTL.ONE_HOUR,
        }),
      ]);
    } catch (error) {
      logger("Error saving tokens");
    }

    return response.access;
  }

  async getAccountBalance(
    accountId: string,
  ): Promise<
    GetAccountBalanceResponse["balances"][0]["balanceAmount"] | undefined
  > {
    const result = await this.getAccountBalances(accountId);
    return result?.primaryBalance;
  }

  /**
   * Get all balances for an account including available balance.
   * Returns primary balance and full balances array for available_balance extraction.
   */
  async getAccountBalances(accountId: string): Promise<{
    primaryBalance:
      | GetAccountBalanceResponse["balances"][0]["balanceAmount"]
      | undefined;
    balances: GetAccountBalanceResponse["balances"] | undefined;
  }> {
    // Cache balances for 15 minutes (shorter than other caches since balances change more)
    const cacheKey = `gocardless_account_balances_${accountId}`;
    const cached = await this.#kv?.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const token = await this.#getAccessToken();

    try {
      const { balances } = await this.#get<GetAccountBalanceResponse>(
        `/api/v2/accounts/${accountId}/balances/`,
        token,
      );

      const foundInterimAvailable = balances?.find(
        (account) =>
          account.balanceType === "interimAvailable" ||
          account.balanceType === "interimBooked",
      );

      // For some accounts, the interimAvailable balance is 0, so we need to use the expected balance
      const foundExpectedAvailable = balances?.find(
        (account) => account.balanceType === "expected",
      );

      const result = {
        primaryBalance:
          foundInterimAvailable?.balanceAmount ||
          foundExpectedAvailable?.balanceAmount,
        balances,
      };

      // Cache for 1 hour (balance during account selection doesn't need to be real-time)
      await this.#kv?.put(cacheKey, JSON.stringify(result), {
        expirationTtl: CACHE_TTL.ONE_HOUR,
      });

      return result;
    } catch (error) {
      const parsedError = isError(error);

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

    const institutions = await this.#kv?.get(cacheKey);

    if (institutions) {
      return JSON.parse(institutions) as GetInstitutionsResponse;
    }

    const token = await this.#getAccessToken();

    const response = await this.#get<GetInstitutionsResponse>(
      "/api/v2/institutions/",
      token,
      undefined,
      {
        params: {
          country: countryCode,
        },
      },
    );

    this.#kv?.put(cacheKey, JSON.stringify(response), {
      expirationTtl: CACHE_TTL.ONE_HOUR,
    });

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
    const token = await this.#getAccessToken();
    const maxHistoricalDays = getMaxHistoricalDays({
      institutionId,
      transactionTotalDays,
    });

    return this.#post<PostCreateAgreementResponse>(
      "/api/v2/agreements/enduser/",
      token,
      {
        institution_id: institutionId,
        access_scope: ["balances", "details", "transactions"],
        access_valid_for_days: getAccessValidForDays({ institutionId }),
        max_historical_days: maxHistoricalDays,
      },
    );
  }

  async getAccountDetails(id: string): Promise<GetAccountDetailsResponse> {
    // Cache account details for 1 hour
    const cacheKey = `gocardless_account_details_${id}`;
    const cached = await this.#kv?.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as GetAccountDetailsResponse;
    }

    const token = await this.#getAccessToken();

    // Only fetch details endpoint - the basic /accounts/{id}/ endpoint returns
    // fields (created, last_accessed, status, owner_name) that aren't used in transforms
    const details = await this.#get<GetAccountDetailsResponse>(
      `/api/v2/accounts/${id}/details/`,
      token,
    );

    const result = {
      ...details,
      id, // Use the account ID we already have (details endpoint doesn't return id)
    };

    await this.#kv?.put(cacheKey, JSON.stringify(result), {
      expirationTtl: CACHE_TTL.FOUR_HOURS,
    });

    return result;
  }

  async getInstitution(id: string): Promise<GetInstitutionResponse> {
    // Cache institution data for 1 hour
    const cacheKey = `gocardless_institution_${id}`;
    const cached = await this.#kv?.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as GetInstitutionResponse;
    }

    const token = await this.#getAccessToken();

    const response = await this.#get<GetInstitutionResponse>(
      `/api/v2/institutions/${id}/`,
      token,
    );

    await this.#kv?.put(cacheKey, JSON.stringify(response), {
      expirationTtl: CACHE_TTL.ONE_HOUR,
    });

    return response;
  }

  async getAccounts({
    id,
  }: GetAccountsRequest): Promise<GetAccountsResponse | undefined> {
    // Check cache first - cache for 1 hour to avoid rate limits (12/day)
    const cacheKey = `${this.#accountsCacheKeyPrefix}_${id}`;
    const cachedAccounts = await this.#kv?.get(cacheKey);

    if (cachedAccounts) {
      logger("Returning cached accounts for requisition", id);
      return JSON.parse(cachedAccounts) as GetAccountsResponse;
    }

    try {
      const response = await this.getRequestion(id);

      if (!response?.accounts) {
        return undefined;
      }

      // Fetch institution once - it's the same for all accounts in a requisition
      const institution = await this.getInstitution(response.institution_id);

      const accounts = await Promise.all(
        response.accounts.map(async (acountId: string) => {
          const [details, balanceResult] = await Promise.all([
            this.getAccountDetails(acountId),
            this.getAccountBalances(acountId),
          ]);

          return {
            balance: balanceResult.primaryBalance,
            balances: balanceResult.balances,
            institution,
            ...details,
          };
        }),
      );

      // Cache the accounts for 4 hours due to strict GoCardLess rate limits (12/day)
      await this.#kv?.put(cacheKey, JSON.stringify(accounts), {
        expirationTtl: CACHE_TTL.FOUR_HOURS,
      });

      return accounts;
    } catch (error) {
      const parsedError = isError(error);

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
      const parsedError = isError(error);

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
    // Cache requisition data for 1 hour to reduce API calls
    const cacheKey = `gocardless_requisition_${id}`;
    const cached = await this.#kv?.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as GetRequisitionResponse;
    }

    try {
      const token = await this.#getAccessToken();

      const response = await this.#get<GetRequisitionResponse>(
        `/api/v2/requisitions/${id}/`,
        token,
      );

      // Only cache if we got valid data
      if (response) {
        await this.#kv?.put(cacheKey, JSON.stringify(response), {
          expirationTtl: CACHE_TTL.ONE_HOUR,
        });
      }

      return response;
    } catch (error) {
      const parsedError = isError(error);

      if (parsedError) {
        throw new ProviderError(parsedError);
      }
    }
  }

  async getRequiestionByReference(
    reference: string,
  ): Promise<GetRequisitionResponse | undefined> {
    const token = await this.#getAccessToken();

    const response = await this.#get<GetRequisitionsResponse>(
      "/api/v2/requisitions/",
      token,
    );

    // Reference is in the format of id:generatedId for unique requisition
    const id = reference.split(":").at(0);

    // Find the requisition with the same id and status of linked
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

  async #getApi(accessToken?: string): Promise<XiorInstance> {
    return xior.create({
      baseURL: this.#baseUrl,
      timeout: 30_000,
      headers: {
        Accept: "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
  }

  async #get<TResponse>(
    path: string,
    token?: string,
    params?: Record<string, string>,
    config?: XiorRequestConfig,
  ): Promise<TResponse> {
    const api = await this.#getApi(token);

    return api
      .get<TResponse>(path, { params, ...config })
      .then(({ data }) => data);
  }

  async #post<TResponse>(
    path: string,
    token?: string,
    body?: unknown,
    config?: XiorRequestConfig,
  ): Promise<TResponse> {
    const api = await this.#getApi(token);
    return api.post<TResponse>(path, body, config).then(({ data }) => data);
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
