import type { Provider } from "../interface";
import type {
  DeleteAccountsRequest,
  DeleteConnectionRequest,
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetConnectionStatusRequest,
  GetTransactionsRequest,
  ProviderParams,
} from "../types";
import { TellerApi } from "./teller-api";
import {
  transformAccount,
  transformAccountBalance,
  transformInstitution,
  transformTransaction,
} from "./transform";

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
      }),
    );
  }

  async getAccounts({ accessToken }: GetAccountsRequest) {
    if (!accessToken) {
      throw Error("accessToken missing");
    }

    const accounts = await this.#api.getAccounts({ accessToken });

    // Fetch account details (routing numbers, account numbers) for each account
    // This is available instantly for most institutions
    const accountsWithDetails = await Promise.all(
      accounts.map(async (account) => {
        const accountDetails = await this.#api.getAccountDetails({
          accountId: account.id,
          accessToken,
        });
        return { ...account, accountDetails };
      }),
    );

    return accountsWithDetails.map(transformAccount);
  }

  async getAccountBalance({
    accessToken,
    accountId,
    accountType,
  }: GetAccountBalanceRequest) {
    if (!accessToken || !accountId) {
      throw Error("Missing params");
    }

    // Fetch both balance (from transactions) and full balances (with available)
    const [balance, balances] = await Promise.all([
      this.#api.getAccountBalance({ accessToken, accountId }),
      this.#api.getAccountBalances({ accessToken, accountId }),
    ]);

    return transformAccountBalance({ balance, balances, accountType });
  }

  async getInstitutions() {
    const response = await this.#api.getInstitutions();

    return response.map(transformInstitution);
  }

  async deleteAccounts({ accessToken }: DeleteAccountsRequest) {
    if (!accessToken) {
      throw Error("accessToken is missing");
    }

    await this.#api.deleteAccounts({
      accessToken,
    });
  }

  async getConnectionStatus({ accessToken }: GetConnectionStatusRequest) {
    if (!accessToken) {
      throw Error("accessToken missing");
    }

    const response = await this.#api.getConnectionStatus({ accessToken });

    return response;
  }

  async deleteConnection({ accessToken }: DeleteConnectionRequest) {
    if (!accessToken) {
      throw Error("accessToken missing");
    }

    await this.#api.deleteAccounts({ accessToken });
  }
}
