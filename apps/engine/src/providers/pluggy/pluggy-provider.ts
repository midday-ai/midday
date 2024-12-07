import type { Provider } from "../interface";
import type {
  DeleteAccountsRequest,
  DeleteConnectionRequest,
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetConnectionStatusRequest,
  GetInstitutionsRequest,
  GetTransactionsRequest,
  ProviderParams,
} from "../types";
import { PluggyApi } from "./pluggy-api";
import { transformAccount, transformTransaction } from "./transform";

export class PluggyProvider implements Provider {
  #api: PluggyApi;

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#api = new PluggyApi(params);
  }

  async getTransactions({ accountId, latest }: GetTransactionsRequest) {
    if (!accountId) {
      throw Error("accountId is missing");
    }

    const response = await this.#api.getTransactions({
      accountId,
      latest,
    });

    return (response ?? []).map(transformTransaction);
  }

  async getHealthCheck() {
    return this.#api.getHealthCheck();
  }

  async getAccounts({ id }: GetAccountsRequest) {
    if (!id) {
      throw Error("id is missing");
    }

    const response = await this.#api.getAccounts(id);

    return (response ?? []).map(transformAccount);
  }

  async getAccountBalance({ accountId }: GetAccountBalanceRequest) {
    if (!accountId) {
      throw Error("Missing params");
    }

    const response = await this.#api.getAccountBalance(accountId);

    if (!response) {
      throw Error("Account not found");
    }

    return response;
  }

  //   async getInstitutions({ countryCode }: GetInstitutionsRequest) {
  //     const response = await this.#api.getInstitutions({
  //       countryCode,
  //     });

  //     return response.map(transformInstitution);
  //   }

  //   async deleteAccounts({ accessToken }: DeleteAccountsRequest) {
  //     if (!accessToken) {
  //       throw Error("accessToken is missing");
  //     }

  //     await this.#api.deleteAccounts({
  //       accessToken,
  //     });
  //   }

  //   async getConnectionStatus({ accessToken }: GetConnectionStatusRequest) {
  //     if (!accessToken) {
  //       throw Error("accessToken is missing");
  //     }

  //     const response = await this.#api.getConnectionStatus({ accessToken });

  //     return response;
  //   }

  //   async deleteConnection({ accessToken }: DeleteConnectionRequest) {
  //     if (!accessToken) {
  //       throw Error("accessToken is missing");
  //     }

  //     await this.#api.deleteAccounts({ accessToken });
  //   }
}
