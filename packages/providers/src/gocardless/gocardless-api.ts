import { client } from "@midday/kv";
import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import {
  DeleteRequistionResponse,
  GetAccessTokenResponse,
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
  PostRequisitionsRequest,
  PostRequisitionsResponse,
} from "./types";

export class GoCardLessApi {
  #baseUrl = "https://bankaccountdata.gocardless.com";

  #api: AxiosInstance | null = null;

  #accessValidForDays = 180;
  #maxHistoricalDays = 730;

  // Cache keys
  #accessTokenCacheKey = "gocardless_access_token";
  #refreshTokenCacheKey = "gocardless_refresh_token";
  #banksCacheKey = "gocardless_banks_v4";

  #oneHour = 3600;

  async #getRefreshToken(refresh: string): Promise<string> {
    const response = await this.#post<GetRefreshTokenResponse>(
      "/api/v2/token/refresh/",
      {
        refresh,
      }
    );

    await client.set(this.#accessTokenCacheKey, response.access, {
      ex: response.access_expires - this.#oneHour,
      nx: true,
    });

    return response.refresh;
  }

  async #getAccessToken(): Promise<string> {
    const [accessToken, refreshToken] = await Promise.all([
      client.get(this.#accessTokenCacheKey),
      client.get(this.#refreshTokenCacheKey),
    ]);

    if (typeof accessToken === "string") {
      return accessToken;
    }

    if (typeof refreshToken === "string") {
      return this.#getRefreshToken(refreshToken);
    }

    const response = await this.#post<GetAccessTokenResponse>(
      "/api/v2/token/new/",
      {
        secret_id: process.env.GOCARDLESS_SECRET_ID,
        secret_key: process.env.GOCARDLESS_SECRET_KEY,
      }
    );

    await Promise.all([
      client.set(this.#accessTokenCacheKey, response.access, {
        ex: response.access_expires - this.#oneHour,
        nx: true,
      }),
      client.set(this.#refreshTokenCacheKey, response.refresh, {
        ex: response.refresh_expires - this.#oneHour,
        nx: true,
      }),
    ]);

    return response.access;
  }

  async getBanks(countryCode?: string): Promise<GetBanksResponse> {
    const banks: GetBanksResponse | null = await client.get(
      this.#banksCacheKey
    );

    if (banks) {
      return banks;
    }

    const response = await this.#get<GetBanksResponse>(
      "/api/v2/institutions/",
      null,
      {
        params: {
          country: countryCode,
        },
      }
    );

    client.set(this.#banksCacheKey, response, {
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
    return this.#post<PostRequisitionsResponse>("/api/v2/requisitions/", {
      redirect,
      institution_id: institutionId,
      agreement,
    });
  }

  async createEndUserAgreement(
    institutionId: string
  ): Promise<PostCreateAgreementResponse> {
    return this.#post<PostCreateAgreementResponse>(
      "/api/v2/agreements/enduser/",
      {
        institution_id: institutionId,
        access_scope: ["balances", "details", "transactions"],
        access_valid_for_days: this.#accessValidForDays,
        max_historical_days: this.#maxHistoricalDays,
      }
    );
  }

  async getAccountDetails(id: string): Promise<GetAccountDetailsResponse> {
    const [account, details] = await Promise.all([
      this.#get<GetAccountResponse>(`/api/v2/accounts/${id}/`),
      this.#get<GetAccountDetailsResponse>(`/api/v2/accounts/${id}/details/`),
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
    dateFrom,
    dateTo,
  }: GetTransactionsRequest): Promise<
    GetTransactionsResponse["transactions"]["booked"]
  > {
    const response = await this.#get<GetTransactionsResponse>(
      `/api/v2/accounts/${accountId}/transactions/`,
      null,
      {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
        },
      }
    );

    return response?.transactions?.booked;
  }

  async getRequisitions(): Promise<GetRequisitionsResponse> {
    return this.#get<GetRequisitionsResponse>("/api/v2/requisitions/");
  }

  async getRequestion(id: string): Promise<GetRequisitionResponse> {
    return this.#get<GetRequisitionResponse>(`/api/v2/requisitions/${id}/`);
  }

  async deleteRequisition(id: string): Promise<DeleteRequistionResponse> {
    return this.#delete<DeleteRequistionResponse>(
      `/api/v2/requisitions/${id}/`
    );
  }

  async #getApi(accessToken?: string): Promise<AxiosInstance> {
    if (!this.#api) {
      this.#api = axios.create({
        baseURL: this.#baseUrl,
        timeout: 30_000,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    return this.#api;
  }

  async #get<TResponse>(
    path: string,
    params?: unknown,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const token = await this.#getAccessToken();
    const api = await this.#getApi(token);

    return api
      .get<TResponse>(path, { params, ...config })
      .then(({ data }) => data);
  }

  async #post<TResponse>(
    path: string,
    body?: unknown,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const api = await this.#getApi();
    return api.post<TResponse>(path, body, config).then(({ data }) => data);
  }

  async #delete<TResponse>(
    path: string,
    params?: unknown,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const api = await this.#getApi();

    return api
      .delete<TResponse>(path, { params, ...config })
      .then(({ data }) => data);
  }
}
