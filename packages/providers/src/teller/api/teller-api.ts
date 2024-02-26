import * as fs from "fs";
import * as https from "https";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import axios from "axios";
import type {
  AuthenticatedRequest,
  GetAccountsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
} from "./types";

export class TellerApi {
  private api: AxiosInstance | null = null;
  private baseURL = "https://api.teller.io";

  /**
   * List accounts a user granted access to in Teller Connect
   *
   * https://teller.io/docs/api/accounts
   */

  async getAccounts({
    accessToken,
  }: AuthenticatedRequest): Promise<GetAccountsResponse> {
    const accounts = await this.get<GetAccountsResponse>(
      "/accounts",
      accessToken
    );

    return accounts;
  }

  /**
   * Get transactions for a single account
   *
   * https://teller.io/docs/api/transactions
   */

  async getTransactions({
    accountId,
    accessToken,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    return this.get<GetTransactionsResponse>(
      `/accounts/${accountId}/transactions`,
      accessToken
    );
  }

  private async getApi(accessToken: string): Promise<AxiosInstance> {
    const cert = fs.readFileSync("./certs/certificate.pem");
    const key = fs.readFileSync("./certs/private_key.pem");

    const agent = new https.Agent({
      cert: cert,
      key: key,
    });

    if (!this.api) {
      this.api = axios.create({
        httpsAgent: agent,
        baseURL: this.baseURL,
        timeout: 30_000,
        headers: {
          Accept: "application/json",
        },
        auth: {
          username: accessToken,
          password: "",
        },
      });
    } else if (this.api.defaults.auth?.username !== accessToken) {
      this.api.defaults.auth = {
        username: accessToken,
        password: "",
      };
    }

    return this.api;
  }

  /** Generic API GET request method */
  private async get<TResponse>(
    path: string,
    accessToken: string,
    params?: any,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const api = await this.getApi(accessToken);
    return api
      .get<TResponse>(path, { params, ...config })
      .then(({ data }) => data);
  }
}
