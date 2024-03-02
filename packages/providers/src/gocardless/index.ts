import { GoCardLessApi } from "./gocardless-api";

export class GoCardLessProvider {
  #api: GoCardLessApi;

  constructor() {
    this.#api = new GoCardLessApi();
  }

  #transformTransactions(transactions) {}

  #transformAccounts() {}

  public async getTransactions(params) {
    try {
      const response = await this.#api.getTransactions(params);
      return this.#transformTransactions(response);
    } catch (error) {
      console.log("getTransactions", error);
    }
  }
}
