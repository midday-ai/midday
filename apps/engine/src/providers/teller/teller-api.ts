import https from "https";
import xior from "xior";
import type { XiorInstance, XiorRequestConfig } from "xior";
import type {
  AuthenticatedRequest,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
} from "./types";

export class TellerApi {
  #baseUrl = "https://api.teller.io";

  #api: XiorInstance | null = null;

  async getHealthcheck() {
    // https://api.teller.io/health
  }

  async getAccounts({
    accessToken,
  }: AuthenticatedRequest): Promise<GetAccountsResponse> {
    return this.#get<GetAccountsResponse>("/accounts", accessToken);
  }

  async getTransactions({
    accountId,
    accessToken,
    latest,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    const result = await this.#get<GetTransactionsResponse>(
      `/accounts/${accountId}/transactions`,
      accessToken,
      latest && {
        count: 500,
      }
    );

    return result;
  }

  async getAccountBalance({
    accountId,
    accessToken,
  }: GetAccountBalanceRequest): Promise<GetAccountBalanceResponse> {
    const result = await this.#get<GetAccountBalanceResponse>(
      `/accounts/${accountId}/balances`,
      accessToken
    );

    return result;
  }

  async #getApi(accessToken: string): Promise<XiorInstance> {
    const cert = Buffer.from(
      process.env.TELLER_CERTIFICATE!,
      "base64"
    ).toString("ascii");

    const key = Buffer.from(
      process.env.TELLER_CERTIFICATE_PRIVATE_KEY!,
      "base64"
    ).toString("ascii");

    const agent = new https.Agent({
      cert,
      key,
    });

    if (!this.#api) {
      this.#api = xior.create({
        httpsAgent: agent,
        baseURL: this.#baseUrl,
        timeout: 30_000,
        headers: {
          Accept: "application/json",
        },
        auth: {
          username: accessToken,
          password: "",
        },
      });
    }

    return this.#api;
  }

  async #get<TResponse>(
    path: string,
    accessToken: string,
    params?: unknown,
    config?: XiorRequestConfig
  ): Promise<TResponse> {
    const api = await this.#getApi(accessToken);

    return api
      .get<TResponse>(path, { params, ...config })
      .then(({ data }) => data);
  }
}
