import { client } from "@midday/kv";
import {
  GoCardLessBank,
  GoCardLessBuildLinkOptions,
  GoCardLessGetAccountsOptions,
  GoCardLessGetTransactionsParams,
  GoCardLessTransaction,
} from "./types";

export class GoCardLessApi {
  #baseUrl = "https://bankaccountdata.gocardless.com";

  #accessValidForDays = 180;
  #maxHistoricalDays = 730;

  // Cache keys
  #accessTokenCacheKey = "gocardless_access_token";
  #refreshTokenCacheKey = "gocardless_refresh_token";
  #banksCacheKey = "gocardless_banks";

  #oneHour = 3600;

  async #getRefreshToken(refresh: string) {
    const res = await fetch(`${this.#baseUrl}/api/v2/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh,
      }),
    });

    const result = await res.json();

    await client.set(this.#accessTokenCacheKey, result.access, {
      ex: result.access_expires - this.#oneHour,
      nx: true,
    });

    return result.access;
  }

  async #getAccessToken() {
    const [accessToken, refreshToken] = await Promise.all([
      client.get(this.#accessTokenCacheKey),
      client.get(this.#refreshTokenCacheKey),
    ]);

    if (accessToken) {
      return accessToken;
    }

    if (typeof refreshToken === "string") {
      return this.#getRefreshToken(refreshToken);
    }

    const res = await fetch(`${this.#baseUrl}/api/v2/token/new/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret_id: process.env.GOCARDLESS_SECRET_ID,
        secret_key: process.env.GOCARDLESS_SECRET_KEY,
      }),
    });

    const result = await res.json();

    await Promise.all([
      client.set(this.#accessTokenCacheKey, result.access, {
        ex: result.access_expires - this.#oneHour,
        nx: true,
      }),
      client.set(this.#refreshTokenCacheKey, result.refresh, {
        ex: result.refresh_expires - this.#oneHour,
        nx: true,
      }),
    ]);

    return result.access;
  }

  public async getBanks(countryCode?: string): Promise<GoCardLessBank[]> {
    const banks: GoCardLessBank[] | null = await client.get(
      this.#banksCacheKey
    );

    if (banks) {
      return banks;
    }

    const token = await this.#getAccessToken();

    const res = await fetch(
      `${
        this.#baseUrl
      }/api/v2/institutions/?country=${countryCode?.toLowerCase()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result: GoCardLessBank[] = await res.json();

    client.set(this.#banksCacheKey, result, {
      ex: this.#oneHour,
      nx: true,
    });

    return result;
  }

  public async buildLink({
    institutionId,
    agreement,
    redirect,
  }: GoCardLessBuildLinkOptions) {
    const token = await this.#getAccessToken();

    const res = await fetch(`${this.#baseUrl}/api/v2/requisitions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        redirect,
        institution_id: institutionId,
        agreement,
      }),
    });

    return res.json();
  }

  public async createEndUserAgreement(institutionId: string) {
    const token = await this.#getAccessToken();

    const res = await fetch(`${this.#baseUrl}/api/v2/agreements/enduser/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        institution_id: institutionId,
        access_scope: ["balances", "details", "transactions"],
        access_valid_for_days: this.#accessValidForDays,
        max_historical_days: this.#maxHistoricalDays,
      }),
    });

    return res.json();
  }

  public async getAccountDetails(id: string) {
    const token = await this.#getAccessToken();

    const [account, details] = await Promise.all([
      fetch(`${this.#baseUrl}/api/v2/accounts/${id}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch(`${this.#baseUrl}/api/v2/accounts/${id}/details/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
    ]);

    const accountData = await account.json();
    const detailsData = await details.json();

    return {
      ...accountData,
      ...detailsData?.account,
    };
  }

  public async getAccounts({
    accountId,
    countryCode,
  }: GoCardLessGetAccountsOptions) {
    const [token, banks] = await Promise.all([
      this.#getAccessToken,
      this.getBanks(countryCode),
    ]);

    const result = await fetch(
      `${this.#baseUrl}/api/v2/requisitions/${accountId}/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await result.json();

    return Promise.all(
      data.accounts?.map(async (id: string) => {
        const accountData = await this.getAccountDetails(id);

        return {
          ...accountData,
          bank: banks.find((bank) => bank.id === accountData.institution_id),
        };
      })
    );
  }

  public async getTransactions(
    params: GoCardLessGetTransactionsParams
  ): Promise<GoCardLessTransaction[]> {
    const token = await this.#getAccessToken();

    const url = new URL(
      `${this.#baseUrl}/api/v2/accounts/${params.accountId}/transactions/`
    );

    if (params.dateFrom) {
      url.searchParams.append("date_from", params.dateFrom);
    }

    if (params.dateTo) {
      url.searchParams.append("date_from", params.dateTo);
    }

    const result = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const response = await result.json();

    return response?.transactions?.booked;
  }

  public async getRequisitions() {
    const token = await this.#getAccessToken();

    const result = await fetch(`${this.#baseUrl}/api/v2/requisitions/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return result.json();
  }

  public async deleteRequisition(id: string) {
    const token = await this.#getAccessToken();

    const result = await fetch(`${this.#baseUrl}/api/v2/requisitions/${id}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return result.json();
  }
}
