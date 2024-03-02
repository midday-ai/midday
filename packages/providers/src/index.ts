import { GetAccountsParams, GetTransactionsParams, Providers } from "./types";

export class BankProvider {
  // #provider: Providers;

  // constructor(provider: Providers) {
  //   // this.#provider = provider;
  // }

  //   constructor(provider: Providers, params) {
  //     return new registeredPartFactories[type](params);
  //   }

  public async getTransactions(params: GetTransactionsParams) {
    return;
  }

  public async getAccounts(params: GetAccountsParams) {
    return;
  }

  public async saveTransactions() {}

  public async saveAccounts() {}
}
