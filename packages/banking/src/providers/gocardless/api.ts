import { formatISO, subDays } from "date-fns";
import { bankingCache, CACHE_TTL } from "../../cache";
import type { GetInstitutionsRequest } from "../../types";
import { ProviderError } from "../../utils/error";
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

type RequestConfig = {
  params?: Record<string, string | undefined>;
};

export class GoCardLessApi {
  #baseUrl = "https://bankaccountdata.gocardless.com";

  #oneHour = 3600;
  #timeout = 30_000;

  #secretKey: string;
  #secretId: string;

  constructor() {
    this.#secretId = process.env.GOCARDLESS_SECRET_ID!;
    this.#secretKey = process.env.GOCARDLESS_SECRET_KEY!;
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

    await bankingCache.set(
      "gocardless",
      "access_token",
      response.access,
      response.access_expires - this.#oneHour,
    );

    return response.refresh;
  }

  async #getAccessToken(): Promise<string> {
    const [accessToken, refreshToken] = await Promise.all([
      bankingCache.get<string>("gocardless", "access_token"),
      bankingCache.get<string>("gocardless", "refresh_token"),
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
          "gocardless",
          "access_token",
          response.access,
          response.access_expires - this.#oneHour,
        ),
        bankingCache.set(
          "gocardless",
          "refresh_token",
          response.refresh,
          response.refresh_expires - this.#oneHour,
        ),
      ]);
    } catch (error) {
      console.log("Error saving tokens");
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

      return {
        primaryBalance:
          foundInterimAvailable?.balanceAmount ||
          foundExpectedAvailable?.balanceAmount,
        balances,
      };
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

    // Check cache first
    const cachedInstitutions = await bankingCache.getKeyed<GetInstitutionsResponse>(
      "gocardless",
      "institutions",
      countryCode || "all",
    );

    if (cachedInstitutions) {
      return cachedInstitutions;
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

    // Cache the response
    await bankingCache.setKeyed(
      "gocardless",
      "institutions",
      countryCode || "all",
      response,
      CACHE_TTL.INSTITUTIONS,
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
          const [details, balanceResult, institution] = await Promise.all([
            this.getAccountDetails(acountId),
            this.getAccountBalances(acountId),
            this.getInstitution(response.institution_id),
          ]);

          return {
            balance: balanceResult.primaryBalance,
            balances: balanceResult.balances,
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

  #buildUrl(path: string, params?: Record<string, string | undefined>): string {
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

  #getHeaders(accessToken?: string): Record<string, string> {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    };
  }

  async #get<TResponse>(
    path: string,
    token?: string,
    params?: Record<string, string>,
    config?: RequestConfig,
  ): Promise<TResponse> {
    const allParams = { ...params, ...config?.params };
    const url = this.#buildUrl(path, allParams);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.#getHeaders(token),
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
    token?: string,
    body?: unknown,
  ): Promise<TResponse> {
    const url = this.#buildUrl(path);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.#getHeaders(token),
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

  async #_delete<TResponse>(
    path: string,
    token: string,
    params?: Record<string, string>,
  ): Promise<TResponse> {
    const url = this.#buildUrl(path, params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: this.#getHeaders(token),
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
}
