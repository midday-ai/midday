import * as https from "https";
import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import {
  AuthenticatedRequest,
  GetAccountBalancesRequest,
  GetAccountBalancesResponse,
  GetAccountsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
} from "./types";

export class TellerApi {
  #baseUrl = "https://api.teller.io";

  #api: AxiosInstance | null = null;

  async getAccountBalances({
    accountId,
    accessToken,
  }: GetAccountBalancesRequest): Promise<GetAccountBalancesResponse> {
    return this.#get<GetAccountBalancesResponse>(
      `/accounts/${accountId}/balances`,
      accessToken
    );
  }

  async getAccounts({
    accessToken,
  }: AuthenticatedRequest): Promise<GetAccountsResponse> {
    const accounts = await this.#get<GetAccountsResponse>(
      "/accounts",
      accessToken
    );

    const accountsWithBalances = await Promise.all(
      accounts.map(async (account) => {
        const balance = await this.getAccountBalances({
          accountId: account.id,
          accessToken,
        });
        return {
          ...account,
          balance,
        };
      })
    );

    return accountsWithBalances;
  }

  async getTransactions({
    accountId,
    accessToken,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    return this.#get<GetTransactionsResponse>(
      `/accounts/${accountId}/transactions`,
      accessToken
    );
  }

  async #getApi(accessToken: string): Promise<AxiosInstance> {
    const cert = JSON.parse(
      Buffer.from(process.env.TELLER_CERTIFICATE!, "base64").toString("ascii")
    );

    const agent = new https.Agent({
      cert,
      key: process.env.TELLER_CERTIFICATE_KEY,
    });

    if (!this.#api) {
      this.#api = axios.create({
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
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const api = await this.#getApi(accessToken);

    return api
      .get<TResponse>(path, { params, ...config })
      .then(({ data }) => data);
  }
}
