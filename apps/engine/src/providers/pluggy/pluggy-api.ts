import { PluggyClient } from "pluggy-sdk";
import type { ProviderParams } from "../types";
import type { GetTransactionsParams } from "./types";

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

  async getAccounts(id: string) {
    return this.#client.fetchAccounts(id);
  }

  async getTransactions({ accountId, latest }: GetTransactionsParams) {
    if (latest) {
      return this.#client.fetchTransactions(accountId);
    }

    return this.#client.fetchAllTransactions(accountId);
  }

  async getHealthCheck() {
    // https://status.pluggy.ai/api/v2/status.json
    // return this.#client.healthCheck();
  }

  async getAccountBalance({
    accessToken,
    accountId,
  }: GetAccountBalanceRequest): Promise<
    GetAccountBalanceResponse | undefined
  > {}

  async getInstitutions() {
    return this.#client.fetchConnectors();
  }

  async getInstitutionById(id: string) {
    return this.#client.fetchConnectorById(id);
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
