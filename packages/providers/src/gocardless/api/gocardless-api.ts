import { client } from "@midday/kv";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import axios from "axios";
import { capitalCase } from "change-case";
import type {
  AuthenticatedRequest,
  GetAccountsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
} from "./types";

const ONE_HOUR = 3600;
const ACCESS_VALID_FOR_DAYS = 180;
const MAX_HISTORICAL_DAYS = 730;

const keys = {
  accessToken: "go_cardless_access_token_v2",
  refreshToken: "go_cardless_refresh_token_v2",
  banks: "go_cardless_banks",
};

export class GoCardLessApi {
  private api: AxiosInstance | null = null;
  private baseURL = "https://bankaccountdata.gocardless.com";

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
    if (!this.api) {
      this.api = axios.create({
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
