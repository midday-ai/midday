import { PluggyClient } from "pluggy-sdk";
import type { ProviderParams } from "../types";

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

  async getAccounts(itemId: string) {
    return this.#client.fetchAccounts(itemId);
  }
}
