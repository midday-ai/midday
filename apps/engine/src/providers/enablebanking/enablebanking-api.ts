import { Buffer } from "node:buffer";
import { ProviderError } from "@/utils/error";
import * as jose from "jose";
import xior, { type XiorInstance, type XiorRequestConfig } from "xior";
import type { GetTransactionsRequest, ProviderParams } from "../types";
import type {
  AuthenticateResponse,
  GetAccountDetailsResponse,
  GetAccountsRequest,
  GetAspspsResponse,
  GetBalancesResponse,
  GetSessionResponse,
  GetTransactionsResponse,
} from "./types";

export class EnableBankingApi {
  #baseUrl = "https://api.enablebanking.com";
  #redirectUrl: string;
  #applicationId: string;
  #keyContent: string;

  // Maximum allowed TTL is 24 hours (86400 seconds)
  #expiresIn = 20; // hours

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#applicationId =
      params.envs.ENABLEBANKING_APPLICATION_ID ||
      process.env.ENABLEBANKING_APPLICATION_ID!;

    this.#keyContent =
      params.envs.ENABLE_BANKING_KEY_CONTENT ||
      process.env.ENABLE_BANKING_KEY_CONTENT!;

    this.#redirectUrl =
      params.envs.ENABLEBANKING_REDIRECT_URL ||
      process.env.ENABLEBANKING_REDIRECT_URL!;
  }

  #encodeData(data: object) {
    return jose.base64url.encode(Buffer.from(JSON.stringify(data)));
  }

  #getJWTHeader() {
    return this.#encodeData({
      typ: "JWT",
      alg: "RS256",
      kid: this.#applicationId,
    });
  }

  #getJWTBody(exp: number) {
    const timestamp = Math.floor(Date.now() / 1000);
    return this.#encodeData({
      iss: "enablebanking.com",
      aud: "api.enablebanking.com",
      iat: timestamp,
      exp: timestamp + exp,
    });
  }

  async #signWithKey(data: string) {
    try {
      const keyBuffer = Buffer.from(this.#keyContent, "base64");
      const pemKey = keyBuffer.toString("utf8");

      const privateKey = await jose.importPKCS8(pemKey, "RS256");

      const signature = await crypto.subtle.sign(
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-256" },
        },
        // @ts-ignore
        privateKey,
        new TextEncoder().encode(data),
      );

      return jose.base64url.encode(new Uint8Array(signature));
    } catch (error) {
      console.error("Error in JWT signing:", error);
      throw error;
    }
  }

  async #generateJWT() {
    const exp = this.#expiresIn * 60 * 60;
    const jwtHeaders = this.#getJWTHeader();
    const jwtBody = this.#getJWTBody(exp);
    const jwtSignature = await this.#signWithKey(`${jwtHeaders}.${jwtBody}`);

    return `${jwtHeaders}.${jwtBody}.${jwtSignature}`;
  }

  async #getApi(): Promise<XiorInstance> {
    const jwt = await this.#generateJWT();

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
      .get<TResponse>(path, {
        params,
        ...config,
        headers: {
          ...config?.headers,
          "Psu-Ip-Address": Array.from(
            { length: 4 },
            () => ~~(Math.random() * 256),
          ).join("."),
          "Psu-User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      })
      .then(({ data }) => data);
  }

  async #post<TResponse>(
    path: string,
    body?: unknown,
    config?: XiorRequestConfig,
  ): Promise<TResponse> {
    const api = await this.#getApi();

    return api.post<TResponse>(path, body, config).then(({ data }) => data);
  }

  async authenticate(params: {
    country: string;
    institutionId: string;
    teamId: string;
    validUntil: string;
    state: string;
  }): Promise<AuthenticateResponse> {
    const { country, institutionId, teamId, validUntil, state } = params;

    try {
      const response = await this.#post<AuthenticateResponse>("/auth", {
        access: {
          balances: true,
          transactions: true,
          valid_until: validUntil,
        },
        aspsp: {
          name: institutionId,
          country,
        },
        psu_type: "business",
        psu_id: teamId,
        redirect_url: this.#redirectUrl,
        state,
      });

      return response;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async exchangeCode(code: string) {
    try {
      const response = await this.#post<GetSessionResponse>("/sessions", {
        code,
      });

      return response;
    } catch (error) {
      console.log(error);
      throw new ProviderError({
        message: "Failed to exchange code",
        // @ts-ignore
        code: error.response?.data?.error ?? "ENABLEBANKING_ERROR",
      });
    }
  }

  async getSession(sessionId: string): Promise<GetSessionResponse> {
    return this.#get<GetSessionResponse>(`/sessions/${sessionId}`);
  }

  async getHealthCheck(): Promise<boolean> {
    try {
      await this.#get<{ message: string }>("/application");
      return true;
    } catch (error) {
      return false;
    }
  }

  async getInstitutions(): Promise<GetAspspsResponse["aspsps"]> {
    const response = await this.#get<GetAspspsResponse>("/aspsps");

    return response.aspsps;
  }

  async getAccountDetails(
    accountId: string,
  ): Promise<GetAccountDetailsResponse> {
    return this.#get<GetAccountDetailsResponse>(
      `/accounts/${accountId}/details`,
    );
  }

  async getAccounts({
    id,
  }: GetAccountsRequest): Promise<GetAccountDetailsResponse[]> {
    const session = await this.getSession(id);

    const accountDetails = await Promise.all(
      session.accounts.map(async (id) => {
        const [details, balance] = await Promise.all([
          this.getAccountDetails(id),
          this.getAccountBalance(id),
        ]);

        return {
          ...details,
          institution: session.aspsp,
          valid_until: session.access.valid_until,
          balance,
        };
      }),
    );

    return accountDetails;
  }

  async getAccountBalance(
    accountId: string,
  ): Promise<GetBalancesResponse["balances"][0]> {
    const response = await this.#get<GetBalancesResponse>(
      `/accounts/${accountId}/balances`,
    );

    // Find balance with highest amount
    const highestBalance = response.balances.reduce((max, current) => {
      const currentAmount = Number.parseFloat(current.balance_amount.amount);
      const maxAmount = Number.parseFloat(max.balance_amount.amount);
      return currentAmount > maxAmount ? current : max;
    }, response.balances[0]);

    return highestBalance;
  }

  async getTransactions({
    accountId,
    latest,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    return this.#get<GetTransactionsResponse>(
      `/accounts/${accountId}/transactions`,
      {
        strategy: latest ? "default" : "longest",
        transaction_status: "BOOK",
      },
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    const api = await this.#getApi();
    await api.delete(`/sessions/${sessionId}`);
  }
}
