import { GoCardLessProvider } from "./gocardless/gocardless-provider";
import { PlaidProvider } from "./plaid/plaid-provider";
import { TellerProvider } from "./teller/teller-provider";
import type {
  GetAccountsRequest,
  GetTransactionsRequest,
  ProviderParams,
} from "./types";

export class Provider {
  #provider;

  constructor({ provider }: ProviderParams) {
    switch (provider) {
      case "gocardless":
        this.#provider = new GoCardLessProvider();
        break;
      case "teller":
        this.#provider = new TellerProvider();
        break;
      case "plaid":
        this.#provider = new PlaidProvider();
        break;
      default:
        throw Error("No provider selected");
    }
  }

  async getTransactions(params: GetTransactionsRequest) {
    return this.#provider?.getTransactions(params);
  }

  async getAccounts(params: GetAccountsRequest) {
    return this.#provider?.getAccounts(params);
  }
}
