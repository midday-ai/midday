import { Redis } from "@upstash/redis/cloudflare";
import { formatISO, subMonths } from "date-fns";
import xior from "xior";
import type { XiorInstance, XiorRequestConfig } from "xior";
import type { ProviderParams } from "../types";
import type {
  DeleteRequistionResponse,
  GetAccessTokenResponse,
  GetAccountBalanceResponse,
  GetAccountDetailsResponse,
  GetAccountResponse,
  GetAccountsRequest,
  GetAccountsResponse,
  GetBanksResponse,
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

export class GoCardLessApi {
  #baseUrl = "https://bankaccountdata.gocardless.com";

  #api: XiorInstance | null = null;

  #accessValidForDays = 180;

  // Cache keys
  #accessTokenCacheKey = "gocardless_access_token";
  #refreshTokenCacheKey = "gocardless_refresh_token";
  #banksCacheKey = "gocardless_banks";

  #redis: Redis;

  #secretId;
  #secretKey;

  #oneHour = 3600;

  constructor({ envs }: ProviderParams) {
    this.#secretId = envs.GOCARDLESS_SECRET_ID;
    this.#secretKey = envs.GOCARDLESS_SECRET_KEY;

    this.#redis = Redis.fromEnv({
      UPSTASH_REDIS_REST_TOKEN: envs.UPSTASH_REDIS_REST_TOKEN,
      UPSTASH_REDIS_REST_URL: envs.UPSTASH_REDIS_REST_URL,
    });
  }

  async #getRefreshToken(refresh: string): Promise<string> {
    const response = await this.#post<GetRefreshTokenResponse>(
      "/api/v2/token/refresh/",
      undefined,
      {
        refresh,
      }
    );

    await this.#redis.set(this.#accessTokenCacheKey, response.access, {
      ex: response.access_expires - this.#oneHour,
      nx: true,
    });

    return response.refresh;
  }

  async #getAccessToken(): Promise<string> {
    const [accessToken, refreshToken] = await Promise.all([
      this.#redis.get(this.#accessTokenCacheKey),
      this.#redis.get(this.#refreshTokenCacheKey),
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
      }
    );

    await Promise.all([
      this.#redis.set(this.#accessTokenCacheKey, response.access, {
        ex: response.access_expires - this.#oneHour,
        nx: true,
      }),
      this.#redis.set(this.#refreshTokenCacheKey, response.refresh, {
        ex: response.refresh_expires - this.#oneHour,
        nx: true,
      }),
    ]);

    return response.access;
  }

  async getAccountBalance(
    accountId: string
  ): Promise<
    GetAccountBalanceResponse["balances"][0]["balanceAmount"] | undefined
  > {
    const token = await this.#getAccessToken();

    const { balances } = await this.#get<GetAccountBalanceResponse>(
      `/api/v2/accounts/${accountId}/balances/`,
      token
    );

    const foundAccount = balances?.find(
      (account) => account.balanceType === "interimAvailable"
    );

    return foundAccount?.balanceAmount;
  }

  async getBanks(countryCode?: string): Promise<GetBanksResponse> {
    const cacheKey = `${this.#banksCacheKey}_${countryCode}`;

    const banks: GetBanksResponse | null = await this.#redis.get(cacheKey);

    if (banks) {
      return banks;
    }

    const token = await this.#getAccessToken();

    const response = await this.#get<GetBanksResponse>(
      "/api/v2/institutions/",
      token,
      null,
      {
        params: {
          country: countryCode,
        },
      }
    );

    this.#redis.set(cacheKey, response, {
      ex: this.#oneHour,
      nx: true,
    });

    return response;
  }

  async buildLink({
    institutionId,
    agreement,
    redirect,
  }: PostRequisitionsRequest): Promise<PostRequisitionsResponse> {
    const token = await this.#getAccessToken();

    return this.#post<PostRequisitionsResponse>(
      "/api/v2/requisitions/",
      token,
      {
        redirect,
        institution_id: institutionId,
        agreement,
      }
    );
  }

  async createEndUserAgreement({
    institutionId,
    transactionTotalDays,
  }: PostEndUserAgreementRequest): Promise<PostCreateAgreementResponse> {
    const token = await this.#getAccessToken();

    return this.#post<PostCreateAgreementResponse>(
      "/api/v2/agreements/enduser/",
      token,
      {
        institution_id: institutionId,
        access_scope: ["balances", "details", "transactions"],
        access_valid_for_days: this.#accessValidForDays,
        max_historical_days: transactionTotalDays,
      }
    );
  }

  async getAccountDetails(id: string): Promise<GetAccountDetailsResponse> {
    const token = await this.#getAccessToken();

    const [account, details] = await Promise.all([
      this.#get<GetAccountResponse>(`/api/v2/accounts/${id}/`, token),
      this.#get<GetAccountDetailsResponse>(
        `/api/v2/accounts/${id}/details/`,
        token
      ),
    ]);

    return {
      ...account,
      ...details,
    };
  }

  async getAccounts({
    id,
    countryCode,
  }: GetAccountsRequest): Promise<GetAccountsResponse> {
    const [banks, response] = await Promise.all([
      this.getBanks(countryCode),
      this.getRequestion(id),
    ]);

    return Promise.all(
      response.accounts?.map(async (acountId: string) => {
        const accountDetails = await this.getAccountDetails(acountId);

        return {
          ...accountDetails,
          bank: banks.find((bank) => bank.id === accountDetails.institution_id),
        };
      })
    );
  }

  async getTransactions({
    accountId,
    latest,
  }: GetTransactionsRequest): Promise<
    GetTransactionsResponse["transactions"]["booked"]
  > {
    const token = await this.#getAccessToken();

    const response = await this.#get<GetTransactionsResponse>(
      `/api/v2/accounts/${accountId}/transactions/`,
      token,
      latest && {
        date_from: formatISO(subMonths(new Date(), 1), {
          representation: "date",
        }),
      }
    );

    return response?.transactions?.booked;
  }

  async getRequisitions(): Promise<GetRequisitionsResponse> {
    const token = await this.#getAccessToken();

    return this.#get<GetRequisitionsResponse>("/api/v2/requisitions/", token);
  }

  async getRequestion(id: string): Promise<GetRequisitionResponse> {
    const token = await this.#getAccessToken();

    return this.#get<GetRequisitionResponse>(
      `/api/v2/requisitions/${id}/`,
      token
    );
  }

  async deleteRequisition(id: string): Promise<DeleteRequistionResponse> {
    const token = await this.#getAccessToken();

    return this.#_delete<DeleteRequistionResponse>(
      `/api/v2/requisitions/${id}/`,
      token
    );
  }

  async #getApi(accessToken?: string): Promise<XiorInstance> {
    if (!this.#api) {
      this.#api = xior.create({
        baseURL: this.#baseUrl,
        timeout: 30_000,
        headers: {
          Accept: "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });
    }

    return this.#api;
  }

  async #get<TResponse>(
    path: string,
    token?: string,
    params?: Record<string, string>,
    config?: XiorRequestConfig
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
    config?: XiorRequestConfig
  ): Promise<TResponse> {
    const api = await this.#getApi(token);
    return api.post<TResponse>(path, body, config).then(({ data }) => data);
  }

  async #_delete<TResponse>(
    path: string,
    token: string,
    params?: Record<string, string>,
    config?: XiorRequestConfig
  ): Promise<TResponse> {
    const api = await this.#getApi(token);

    return api
      .delete<TResponse>(path, { params, ...config })
      .then(({ data }) => data);
  }
}
