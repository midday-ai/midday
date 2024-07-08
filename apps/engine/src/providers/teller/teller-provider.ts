import type { Provider } from "../interface";
import type {
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetInstitutionsRequest,
  GetTransactionsRequest,
  ProviderParams,
} from "../types";
import { TellerApi } from "./teller-api";
import { transformAccount, transformTransaction } from "./transform";

export class TellerProvider implements Provider {
  #api: TellerApi;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#api = new TellerApi(params);
  }

  async getHealthCheck() {
    return this.#api.getHealthCheck();
  }

  async getTransactions({
    accountId,
    accessToken,
    accountType,
    latest,
  }: GetTransactionsRequest) {
    if (!accessToken) {
      throw Error("accessToken missing");
    }

    const response = await this.#api.getTransactions({
      accountId,
      accessToken,
      latest,
    });

    return response.map((transaction) =>
      transformTransaction({
        transaction,
        accountType,
      })
    );
  }

  async getAccounts({ accessToken }: GetAccountsRequest) {
    if (!accessToken) {
      throw Error("accessToken missing");
    }

    const response = await this.#api.getAccounts({ accessToken });

    return response.map(transformAccount);
  }

  async getAccountBalance({
    accessToken,
    accountId,
  }: GetAccountBalanceRequest) {
    if (!accessToken || !accountId) {
      throw Error("Missing params");
    }

    return this.#api.getAccountBalance({
      accessToken,
      accountId,
    });
  }

  async getInstitutions({ countryCode }: GetInstitutionsRequest) {
    const response = await this.#api.getInstitutions({ countryCode });

    return response;
  }
}
