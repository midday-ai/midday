import { ProviderError } from "@/utils/error";
import { logger } from "@/utils/logger";
import { formatISO, subDays } from "date-fns";
import xior from "xior";
import type { XiorInstance, XiorRequestConfig } from "xior";
import type { GetInstitutionsRequest, ProviderParams } from "../types";
import type {
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
import { getAccessValidForDays, getMaxHistoricalDays, isError } from "./utils";

export class GoCardLessApi {
  #baseUrl = "https://bankaccountdata.gocardless.com";

  // Cache keys
  #accessTokenCacheKey = "gocardless_access_token";
  #refreshTokenCacheKey = "gocardless_refresh_token";
  #institutionsCacheKey = "gocardless_institutions";

  #kv: KVNamespace;

  #oneHour = 3600;

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
      expirationTtl: response.access_expires - this.#oneHour,
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
          expirationTtl: response.access_expires - this.#oneHour,
        }),
        this.#kv?.put(this.#refreshTokenCacheKey, response.refresh, {
          expirationTtl: response.refresh_expires - this.#oneHour,
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

      return (
        foundInterimAvailable?.balanceAmount ||
        foundExpectedAvailable?.balanceAmount
      );
    } catch (error) {
      const parsedError = isError(error);

      if (parsedError) {
        throw new ProviderError(parsedError);
      }
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
      expirationTtl: this.#oneHour,
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
    const token = await this.#getAccessToken();

    const [account, details] = await Promise.all([
      this.#get<GetAccountResponse>(`/api/v2/accounts/${id}/`, token),
      this.#get<GetAccountDetailsResponse>(
        `/api/v2/accounts/${id}/details/`,
        token,
      ),
    ]);

    return {
      ...account,
      ...details,
    };
  }

  async getInstitution(id: string): Promise<GetInstitutionResponse> {
    const token = await this.#getAccessToken();

    return this.#get<GetInstitutionResponse>(
      `/api/v2/institutions/${id}/`,
      token,
    );
  }

  async getAccounts({
    id,
  }: GetAccountsRequest): Promise<GetAccountsResponse | undefined> {
    try {
      const response = await this.getRequestion(id);

      if (!response?.accounts) {
        return undefined;
      }

      return Promise.all(
        response.accounts.map(async (acountId: string) => {
          const [details, balance, institution] = await Promise.all([
            this.getAccountDetails(acountId),
            this.getAccountBalance(acountId),
            this.getInstitution(response.institution_id),
          ]);

          return {
            balance,
            institution,
            ...details,
          };
        }),
      );
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
              date_from: formatISO(subDays(new Date(), 7), {
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
    try {
      const token = await this.#getAccessToken();

      return this.#get<GetRequisitionResponse>(
        `/api/v2/requisitions/${id}/`,
        token,
      );
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
