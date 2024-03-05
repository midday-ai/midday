import { Provider } from "../interface";
import { GetAccountsRequest, GetTransactionsRequest } from "../types";
import { TellerApi } from "./teller-api";
import { transformAccount, transformTransaction } from "./transform";

export class TellerProvider implements Provider {
  #api: TellerApi;

  constructor() {
    this.#api = new TellerApi();
  }

  async getTransactions({
    teamId,
    accountId,
    bankAccountId,
    accessToken,
  }: GetTransactionsRequest) {
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
        bankAccountId,
      })
    );
  }

  async getAccounts({ accessToken }: GetAccountsRequest) {
    if (!accessToken) {
      throw Error("accessToken missing");
    }

    const response = await this.#api.getAccounts({ accessToken });

    return response.map((account) =>
      transformAccount({
        id: account.id,
        name: account.name,
        currency: account.currency,
        enrolmentId: account.enrollment_id,
        institution: account.institution,
      })
    );
  }
}
