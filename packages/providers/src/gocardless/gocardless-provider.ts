import { Provider } from "../interface";
import { GetAccountsParams, GetTransactionsParams } from "../types";
import { GoCardLessApi } from "./gocardless-api";
import { transformTransaction } from "./transform";

export class GoCardLessProvider implements Provider {
  #api: GoCardLessApi;

  constructor() {
    this.#api = new GoCardLessApi();
  }

  public async getTransactions(params: GetTransactionsParams) {
    const { dateFrom, dateTo, teamId, accountId } = params;

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

  public async getAccounts(params: GetAccountsParams) {
    const { accountId, countryCode } = params;

    const response = await this.#api.getAccounts({
      accountId,
      countryCode,
    });

    return response;
  }
}
