import { Buffer } from "node:buffer";
import fs from "node:fs";
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

  // Maximum allowed TTL is 24 hours (86400 seconds)
  #expiresIn = 23; // hours

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#applicationId = params.envs.ENABLEBANKING_APPLICATION_ID;
    this.#keyContent = params.envs.ENABLE_BANKING_KEY_CONTENT;
  }

  private encodeData(data: object) {
    return jose.base64url.encode(Buffer.from(JSON.stringify(data)));
  }

  private getJWTHeader() {
    return this.encodeData({
      typ: "JWT",
      alg: "RS256",
      kid: this.#applicationId,
    });
  }

  private getJWTBody(exp: number) {
    const timestamp = Math.floor(Date.now() / 1000);
    return this.encodeData({
      iss: "enablebanking.com",
      aud: "api.enablebanking.com",
      iat: timestamp,
      exp: timestamp + exp,
    });
  }

  async signWithKey(data: string) {
    const decodedKey = Buffer.from(this.#keyContent, "base64").toString(
      "utf-8",
    );

    const pemKey = decodedKey.includes("BEGIN PRIVATE KEY")
      ? decodedKey
      : `-----BEGIN PRIVATE KEY-----\n${decodedKey}\n-----END PRIVATE KEY-----`;

    console.log(decodedKey.includes("BEGIN PRIVATE KEY"));

    const privateKey = await jose.importPKCS8(pemKey, "RS256");

    // Sign directly with RSA-SHA256
    const signature = await crypto.subtle.sign(
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" },
      },
      // @ts-expect-error
      privateKey,
      new TextEncoder().encode(data),
    );

    return jose.base64url.encode(new Uint8Array(signature));
  }

  private async generateJWT() {
    const exp = this.#expiresIn * 60 * 60;
    const jwtHeaders = this.getJWTHeader();
    const jwtBody = this.getJWTBody(exp);
    const jwtSignature = await this.signWithKey(`${jwtHeaders}.${jwtBody}`);

    return `${jwtHeaders}.${jwtBody}.${jwtSignature}`;
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
    // return this.#get<GetTransactionsResponse>(
    //   `/accounts/${accountId}/transactions`,
    //   params,
    // );

    const katt = await this.#get<GetTransactionsResponse>("/aspsps", params);
    console.log(katt);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const api = await this.#getApi();
    await api.delete(`/sessions/${sessionId}`);
  }
}
