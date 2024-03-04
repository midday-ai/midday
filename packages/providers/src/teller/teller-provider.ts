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
        accountId,
      })
    );
  }

  async getAccounts({
    accessToken,
    teamId,
    accountId,
    userId,
    bankConnectionId,
  }: GetAccountsRequest) {
    if (!accessToken) {
      throw Error("accessToken missing");
    }

    const response = await this.#api.getAccounts({ accessToken });

    return response.map((account) =>
      transformAccount({
        name: account.name,
        currency: account.currency,
        userId: userId,
        teamId: teamId,
        accountId: accountId,
        bankConnectionId: bankConnectionId,
        enrolmentId: account.enrollment_id,
        institution: account.institution,
      })
    );
  }
}
