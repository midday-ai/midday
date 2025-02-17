import * as jose from "jose";
import xior, { type XiorInstance, type XiorRequestConfig } from "xior";
import type { ProviderParams } from "../types";
import type {
  GetAspspsResponse,
  GetBalancesResponse,
  GetSessionResponse,
  GetTransactionsResponse,
} from "./types";

export class EnableBankingApi {
  #baseUrl = "https://api.enablebanking.com";
  #applicationId: string;
  #keyContent: string;
  #expiresIn = 23;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#applicationId = params.envs.ENABLEBANKING_APPLICATION_ID;
    this.#keyContent = params.envs.ENABLE_BANKING_KEY_CONTENT;
  }

  private async generateJWT() {
    const privateKey = Buffer.from(this.#keyContent, "base64");

    const key = await jose.importPKCS8(privateKey.toString(), "RS256");

    const jwt = await new jose.SignJWT({
      iss: "enablebanking.com",
      aud: "api.enablebanking.com",
    })
      .setProtectedHeader({
        typ: "JWT",
        alg: "RS256",
        kid: this.#applicationId,
      })
      .setIssuedAt()
      .setExpirationTime(`${this.#expiresIn}h`)
      .sign(key);

    return jwt;
  }

  async #getApi(): Promise<XiorInstance> {
    const jwt = await this.generateJWT();

    return xior.create({
      baseURL: this.#baseUrl,
      timeout: 30_000,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwt}`,
      },
    });
  }

  async #get<TResponse>(
    path: string,
    params?: Record<string, string>,
    config?: XiorRequestConfig,
  ): Promise<TResponse> {
    const api = await this.#getApi();

    return api
      .get<TResponse>(path, { params, ...config })
      .then(({ data }) => data);
  }

  async getHealthCheck(): Promise<boolean> {
    try {
      await this.#get<{ message: string }>("/application");
      return true;
    } catch (error) {
      return false;
    }
  }

  async getInstitutions(): Promise<GetAspspsResponse> {
    return this.#get<GetAspspsResponse>("/aspsps");
  }

  async getAccounts(sessionId: string): Promise<GetSessionResponse> {
    return this.#get<GetSessionResponse>(`/sessions/${sessionId}`);
  }

  async getAccountBalance(accountId: string): Promise<GetBalancesResponse> {
    return this.#get<GetBalancesResponse>(`/accounts/${accountId}/balances`);
  }

  async getTransactions(
    accountId: string,
    params?: {
      date_from?: string;
      date_to?: string;
      continuation_key?: string;
    },
  ): Promise<GetTransactionsResponse> {
    return this.#get<GetTransactionsResponse>(
      `/accounts/${accountId}/transactions`,
      params,
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    const api = await this.#getApi();
    await api.delete(`/sessions/${sessionId}`);
  }
}
