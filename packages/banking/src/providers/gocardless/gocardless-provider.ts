import type { Provider } from "../../interface";
import type {
  DeleteAccountsRequest,
  DeleteConnectionRequest,
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetConnectionStatusRequest,
  GetInstitutionsRequest,
  GetTransactionsRequest,
} from "../../types";
import { ProviderError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { GoCardLessApi } from "./gocardless-api";
import {
  transformAccount,
  transformAccountBalance,
  transformConnectionStatus,
  transformInstitution,
  transformTransaction,
} from "./transform";

export class GoCardLessProvider implements Provider {
  #api: GoCardLessApi;

  constructor() {
    this.#api = new GoCardLessApi();
  }

  async getHealthCheck() {
    return this.#api.getHealthCheck();
  }

  async getTransactions({
    accountId,
    latest,
    accountType,
  }: GetTransactionsRequest) {
    const response = await this.#api.getTransactions({
      latest,
      accountId,
    });

    return (response ?? []).map((transaction) =>
      transformTransaction({
        transaction,
        accountType,
      }),
    );
  }

  async getAccounts({ id }: GetAccountsRequest) {
    if (!id) {
      throw Error("Missing params");
    }

    const response = await this.#api.getAccounts({ id });

    return (response ?? []).map(transformAccount);
  }

  async getAccountBalance({
    accountId,
    accountType,
  }: GetAccountBalanceRequest) {
    if (!accountId) {
      throw Error("Missing params");
    }

    const { primaryBalance, balances } =
      await this.#api.getAccountBalances(accountId);

    return transformAccountBalance({
      balance: primaryBalance?.balanceAmount,
      balances,
      accountType,
    });
  }

  async getInstitutions({ countryCode }: GetInstitutionsRequest) {
    if (!countryCode) {
      throw Error("Missing countryCode");
    }

    const response = await this.#api.getInstitutions({ countryCode });

    return response.map(transformInstitution);
  }

  async deleteAccounts({ accountId }: DeleteAccountsRequest) {
    if (!accountId) {
      throw Error("Missing params");
    }

    await this.#api.deleteRequisition(accountId);
  }

  async getConnectionStatus({ id }: GetConnectionStatusRequest) {
    if (!id) {
      throw Error("Missing params");
    }

    try {
      const response = await this.#api.getRequestion(id);

      return transformConnectionStatus(response);
    } catch (error) {
      if (error instanceof ProviderError && error.code === "disconnected") {
        return { status: "disconnected" as const };
      }

      logger.error("GoCardless connection status check failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  async deleteConnection({ id }: DeleteConnectionRequest) {
    if (!id) {
      throw Error("Missing params");
    }

    await this.#api.deleteRequisition(id);
  }
}
