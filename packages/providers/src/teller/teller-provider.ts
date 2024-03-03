import { Provider } from "../interface";
import { GetAccountsParams, GetTransactionsParams } from "../types";
import { TellerApi } from "./teller-api";
import { transformTransaction } from "./transform";

export class TellerProvider implements Provider {
  #api: TellerApi;

  constructor() {
    this.#api = new TellerApi();
  }

  async getTransactions(params: GetTransactionsParams) {
    const { teamId, accountId, accessToken } = params;

    if (!accessToken) {
      throw Error("accessToken missing");
    }

    const response = await this.#api.getTransactions({
      accountId,
      accessToken,
    });

    return response.map((transaction) =>
      transformTransaction({
        transaction,
        teamId,
        accountId,
      })
    );
  }

  async getAccounts(params: GetAccountsParams) {
    // const { accountId, countryCode } = params;
    // const response = await this.#api.getAccounts({
    //   accountId,
    //   countryCode,
    // });
    // return response;
  }
}
