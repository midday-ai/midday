import { PluggyClient } from "pluggy-sdk";
import type {
  GetAccountBalanceResponse,
  GetConnectionStatusRequest,
  ProviderParams,
} from "../types";
import type {
  GetAccountsRequest,
  GetInstitutionsRequest,
  GetStatusResponse,
  GetTransactionsParams,
} from "./types";

export class PluggyApi {
  #client: PluggyClient;
  #clientId: string;
  #clientSecret: string;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#clientId = params.envs.PLUGGY_CLIENT_ID;
    this.#clientSecret = params.envs.PLUGGY_SECRET;

    this.#client = new PluggyClient({
      clientId: this.#clientId,
      clientSecret: this.#clientSecret,
    });
  }

  #generateWebhookUrl(environment: "sandbox" | "production") {
    if (environment === "sandbox") {
      return "https://staging.app.midday.ai/api/webhook/pluggy";
    }

    return "https://app.midday.ai/api/webhook/pluggy";
  }

  async getAccounts({ id, institutionId }: GetAccountsRequest) {
    const response = await this.#client.fetchAccounts(id);

    const institution = await this.getInstitutionById(Number(institutionId));

    return response.results.map((account) => ({
      ...account,
      institution,
    }));
  }

  async getTransactions({ accountId, latest }: GetTransactionsParams) {
    if (latest) {
      const response = await this.#client.fetchTransactions(accountId);

      return response.results;
    }

    const response = await this.#client.fetchAllTransactions(accountId);

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
    const response = await this.#client.fetchAccount(accountId);

    return {
      currency: response.currencyCode,
      amount: response.balance,
    };
  }

  async getInstitutions({ countries }: GetInstitutionsRequest) {
    const response = await this.#client.fetchConnectors({
      countries,
    });

    return response.results;
  }

  async getInstitutionById(id: number) {
    return this.#client.fetchConnector(id);
  }

  async getConnectionStatus({ id }: GetConnectionStatusRequest) {
    return this.#client.consentRetrieve(id);
  }

  async deleteAccounts() {}

  async linkTokenCreate({
    userId,
    webhookUrl,
    environment = "production",
  }: LinkTokenCreateRequest) {
    const { accessToken: connectToken } = await this.#client.createConnectToken(
      ITEM_ID_TO_UPDATE,
      {
        clientUserId: userId,
        webhook: this.#generateWebhookUrl(environment),
      },
    );
  }
}
