import type { Provider } from "../interface";
import type {
  GetAccountsRequest,
  GetTransactionsRequest,
  ProviderParams,
} from "../types";
import { GoCardLessApi } from "./gocardless-api";
import { transformAccount, transformTransaction } from "./transform";

export class GoCardLessProvider implements Provider {
  #api: GoCardLessApi;

  constructor(params: ProviderParams) {
    this.#api = new GoCardLessApi(params);
  }

  async getTransactions({
    teamId,
    accountId,
    bankAccountId,
    latest,
  }: GetTransactionsRequest) {
    const response = await this.#api.getTransactions({
      latest,
      accountId,
    });

    return response.map((transaction) =>
      transformTransaction({
        transaction,
        teamId,
        bankAccountId,
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

    return response.map(transformAccount);
  }
}
