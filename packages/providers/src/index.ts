import { GoCardLessProvider } from "./gocardless/gocardless-provider";
import {
  GetAccountsParams,
  GetTransactionsParams,
  TransactionProviderParams,
} from "./types";

export class TransactionProvider {
  #provider;

  constructor({ provider }: TransactionProviderParams) {
    switch (provider) {
      case "gocardless":
        this.#provider = new GoCardLessProvider();
        break;
      case "plaid":
        throw Error("Not implemented");
      case "teller":
        throw Error("Not implemented");
      default:
        throw Error("No provider selected");
    }
  }

  public async getTransactions(params: GetTransactionsParams) {
    return this.#provider?.getTransactions(params);
  }

  public async getAccounts(params: GetAccountsParams) {
    return this.#provider?.getAccounts(params);
  }
}
