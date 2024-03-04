import { Provider } from "../interface";
import { GetAccountsRequest, GetTransactionsRequest } from "../types";
import { GoCardLessApi } from "./gocardless-api";
import { transformAccount, transformTransaction } from "./transform";

export class GoCardLessProvider implements Provider {
  #api: GoCardLessApi;

  constructor() {
    this.#api = new GoCardLessApi();
  }

  async getTransactions({
    dateFrom,
    dateTo,
    teamId,
    accountId,
  }: GetTransactionsRequest) {
    const response = await this.#api.getTransactions({
      dateFrom,
      dateTo,
      accountId,
    });

    return response.map((transaction) =>
      transformTransaction({
        transaction,
        teamId,
        accountId,
      })
    );
  }

  async getAccounts({ id, countryCode }: GetAccountsRequest) {
    if (!countryCode || !id) {
      throw Error("Missing params");
    }

    const response = await this.#api.getAccounts({
      id,
      countryCode,
    });

    return response.map(({ id, account, bank }) =>
      transformAccount({
        id,
        name: account.name,
        currency: account.currency,
        bank,
        product: account.product,
      })
    );
  }
}
