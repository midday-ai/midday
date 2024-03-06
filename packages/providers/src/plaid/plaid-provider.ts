import { Provider } from "../interface";
import { GetAccountsRequest, GetTransactionsRequest } from "../types";
import { PlaidApi } from "./plaid-api";
import { transformAccount, transformTransaction } from "./transform";

export class PlaidProvider implements Provider {
  #api: PlaidApi;

  constructor() {
    this.#api = new PlaidApi();
  }

  async getTransactions({
    accessToken,
    teamId,
    accountId,
  }: GetTransactionsRequest) {
    if (!accessToken) {
      throw Error("accessToken missing");
    }

    const response = await this.#api.getTransactions({
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

  async getAccounts({ accessToken, institutionId }: GetAccountsRequest) {
    if (!accessToken || !institutionId) {
      throw Error("accessToken or institutionId is missing");
    }

    const response = await this.#api.getAccounts({
      accessToken,
      institutionId,
    });

    return response?.map((account) => {
      return transformAccount({
        id: account.account_id,
        name: account.name,
        currency:
          account.balances.iso_currency_code ||
          account.balances.unofficial_currency_code,
        institution: account.institution,
      });
    });
  }
}
