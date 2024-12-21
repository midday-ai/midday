import * as jwt from "jsonwebtoken";
import xior from "xior";
import type { XiorInstance, XiorRequestConfig } from "xior";
import type {
  GetAccountBalanceResponse,
  GetConnectionStatusRequest,
  ProviderParams,
} from "../types";
import type {
  ConnectTokenResponse,
  GetAccountsRequest,
  GetInstitutionsRequest,
  GetStatusResponse,
  GetTransactionsParams,
  LinkTokenCreateRequest,
} from "./types";

export class PluggyApi {
  #clientId: string;
  #clientSecret: string;
  #apiKey?: string;

  #baseUrl = "https://api.pluggy.ai";

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#clientId = params.envs.PLUGGY_CLIENT_ID;
    this.#clientSecret = params.envs.PLUGGY_SECRET;
  }

  async #getApiKey() {
    if (this.#apiKey && !this.#isJwtExpired(this.#apiKey)) {
      return this.#apiKey;
    }

    const response = await this.#post("/auth", undefined, {
      clientId: this.#clientId,
      clientSecret: this.#clientSecret,
      nonExpiring: false,
    });

    this.#apiKey = response.apiKey;

    return this.#apiKey;
  }

  #generateWebhookUrl(environment: "sandbox" | "production") {
    if (environment === "sandbox") {
      return "https://staging.app.midday.ai/api/webhook/pluggy";
    }

    return "https://app.midday.ai/api/webhook/pluggy";
  }

  #isJwtExpired(token: string) {
    const decoded = jwt.decode(token, { complete: true });

    // @ts-expect-error
    return decoded.payload.exp <= Math.floor(Date.now() / 1000);
  }

  async getAccounts({ id, institutionId }: GetAccountsRequest) {
    const response = await this.#get(`/items/${id}/accounts`);

    const institution = await this.getInstitutionById(Number(institutionId));

    return response.results.map((account) => ({
      ...account,
      institution,
    }));
  }

  async getTransactions({ accountId, latest }: GetTransactionsParams) {
    if (latest) {
      const response = await this.#get(`/items/${id}/transactions`);

      return response.results;
    }

    const response = await this.#get(`/items/${id}/transactions`);

    return response;
  }

  async getHealthCheck() {
    try {
      const response = await fetch(
        "https://status.pluggy.ai/api/v2/status.json",
      );

      const data = (await response.json()) as GetStatusResponse;

      return (
        data.status.indicator === "none" ||
        data.status.indicator === "maintenance"
      );
    } catch {
      return false;
    }
  }

  async getAccountBalance(
    accountId: string,
  ): Promise<GetAccountBalanceResponse | undefined> {
    const response = await this.#get(`/items/${id}/accounts/${accountId}`);

    return {
      currency: response.currencyCode,
      amount: response.balance,
    };
  }

  async getInstitutions({ countries }: GetInstitutionsRequest) {
    const response = await this.#get("/connectors", undefined, {
      countries: countries,
    });

    return response.results;
  }

  async getInstitutionById(id: number) {
    return this.#get(`/connectors/${id}`);
  }

  async getConnectionStatus({ id }: GetConnectionStatusRequest) {
    return this.#get(`/consents/${id}`);
  }

  async deleteAccounts() {}

  async linkTokenCreate({
    userId,
    environment = "production",
  }: LinkTokenCreateRequest): Promise<ConnectTokenResponse> {
    const apiKey = await this.#getApiKey();

    const response = await this.#post("/connect_token", apiKey, {
      clientUserId: userId,
      webhookUrl: this.#generateWebhookUrl(environment),
    });

    return {
      accessToken: response.accessToken,
    };
  }

  async #getApi(apiKey?: string): Promise<XiorInstance> {
    return xior.create({
      baseURL: this.#baseUrl,
      timeout: 30_000,
      headers: {
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
    });
  }

  async #get<TResponse>(
    path: string,
    apiKey?: string,
    params?: Record<string, string>,
    config?: XiorRequestConfig,
  ): Promise<TResponse> {
    const api = await this.#getApi(apiKey);

    return api
      .get<TResponse>(path, { params, ...config })
      .then(({ data }) => data);
  }

  async #post<TResponse>(
    path: string,
    apiKey?: string,
    body?: unknown,
    config?: XiorRequestConfig,
  ): Promise<TResponse> {
    const api = await this.#getApi(apiKey);
    return api.post<TResponse>(path, body, config).then(({ data }) => data);
  }

  async #_delete<TResponse>(
    path: string,
    apiKey?: string,
    params?: Record<string, string>,
    config?: XiorRequestConfig,
  ): Promise<TResponse> {
    const api = await this.#getApi(apiKey);

    return api
      .delete<TResponse>(path, { params, ...config })
      .then(({ data }) => data);
  }
}
