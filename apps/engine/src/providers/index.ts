import { GoCardLessProvider } from "./gocardless/gocardless-provider";
// import { PlaidProvider } from "./plaid/plaid-provider";
// import { TellerProvider } from "./teller/teller-provider";
import type {
  GetAccountsRequest,
  GetTransactionsRequest,
  ProviderParams,
} from "./types";

export class Provider {
  #provider;

  constructor(params: ProviderParams) {
    switch (params.provider) {
      case "gocardless":
        this.#provider = new GoCardLessProvider(params);
        break;
      // case "teller":
      //   this.#provider = new TellerProvider(params);
      //   break;
      // case "plaid":
      //   this.#provider = new PlaidProvider(params);
      // break;
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
