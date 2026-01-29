import { createLoggerWithContext } from "@midday/logger";
import type {
  DeleteAccountsRequest,
  DeleteConnectionRequest,
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetConnectionStatusRequest,
  GetHealthCheckResponse,
  GetInstitutionsRequest,
  GetTransactionsRequest,
  Providers,
} from "../types";
import { EnableBankingProvider } from "./enablebanking/provider";
import { GoCardLessProvider } from "./gocardless/provider";
import { PlaidProvider } from "./plaid/provider";
import { TellerProvider } from "./teller/provider";

const logger = createLoggerWithContext("banking");

export type ProviderParams = {
  provider: Providers;
};

export class Provider {
  #name?: string;

  #provider:
    | PlaidProvider
    | TellerProvider
    | GoCardLessProvider
    | EnableBankingProvider
    | null = null;

  constructor(params?: ProviderParams) {
    this.#name = params?.provider;

    switch (params?.provider) {
      case "gocardless":
        this.#provider = new GoCardLessProvider();
        break;
      case "teller":
        this.#provider = new TellerProvider();
        break;
      case "plaid":
        this.#provider = new PlaidProvider();
        break;
      case "enablebanking":
        this.#provider = new EnableBankingProvider();
        break;
      default:
    }
  }

  async getHealthCheck(): Promise<GetHealthCheckResponse> {
    const teller = new TellerProvider();
    const plaid = new PlaidProvider();
    const gocardless = new GoCardLessProvider();
    const enablebanking = new EnableBankingProvider();

    try {
      const [
        isPlaidHealthy,
        isGocardlessHealthy,
        isTellerHealthy,
        isEnableBankingHealthy,
      ] = await Promise.all([
        plaid.getHealthCheck(),
        gocardless.getHealthCheck(),
        teller.getHealthCheck(),
        enablebanking.getHealthCheck(),
      ]);

      return {
        plaid: {
          healthy: isPlaidHealthy,
        },
        gocardless: {
          healthy: isGocardlessHealthy,
        },
        teller: {
          healthy: isTellerHealthy,
        },
        enablebanking: {
          healthy: isEnableBankingHealthy,
        },
      };
    } catch {
      throw Error("Something went wrong");
    }
  }

  async getTransactions(params: GetTransactionsRequest) {
    logger.debug("getTransactions", {
      provider: this.#name,
      accountId: params.accountId,
    });

    const data = await this.#provider?.getTransactions(params);

    if (data) {
      return data;
    }

    return [];
  }

  async getAccounts(params: GetAccountsRequest) {
    logger.debug("getAccounts", { provider: this.#name });

    const data = await this.#provider?.getAccounts(params);

    if (data) {
      return data;
    }

    return [];
  }

  async getAccountBalance(params: GetAccountBalanceRequest) {
    logger.debug("getAccountBalance", {
      provider: this.#name,
      accountId: params.accountId,
    });

    const data = await this.#provider?.getAccountBalance(params);

    if (data) {
      return data;
    }

    return null;
  }

  async getInstitutions(params: GetInstitutionsRequest) {
    logger.debug("getInstitutions", { provider: this.#name });

    const data = await this.#provider?.getInstitutions(params);

    if (data) {
      return data;
    }

    return [];
  }

  async deleteAccounts(params: DeleteAccountsRequest) {
    logger.debug("deleteAccounts", { provider: this.#name });

    return this.#provider?.deleteAccounts(params);
  }

  async getConnectionStatus(params: GetConnectionStatusRequest) {
    logger.debug("getConnectionStatus", { provider: this.#name });

    const data = await this.#provider?.getConnectionStatus(params);

    if (data) {
      return data;
    }

    return { status: "connected" as const };
  }

  async deleteConnection(params: DeleteConnectionRequest) {
    logger.debug("deleteConnection", { provider: this.#name });

    return this.#provider?.deleteConnection(params);
  }
}

// Re-export individual providers and APIs for direct use
export { PlaidApi, PlaidProvider } from "./plaid";
export { TellerApi, TellerProvider } from "./teller";
export { GoCardLessApi, GoCardLessProvider } from "./gocardless";
export { EnableBankingApi, EnableBankingProvider } from "./enablebanking";
