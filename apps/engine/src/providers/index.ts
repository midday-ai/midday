import { logger } from "@/utils/logger";
import { EnableBankingProvider } from "./enablebanking/enablebanking-provider";
import { GoCardLessProvider } from "./gocardless/gocardless-provider";
import { PlaidProvider } from "./plaid/plaid-provider";
import { TellerProvider } from "./teller/teller-provider";
import type {
  DeleteAccountsRequest,
  DeleteConnectionRequest,
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetConnectionStatusRequest,
  GetHealthCheckResponse,
  GetInstitutionsRequest,
  GetTransactionsRequest,
  ProviderParams,
} from "./types";
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
        this.#provider = new GoCardLessProvider(params);
        break;
      case "teller":
        this.#provider = new TellerProvider(params);
        break;
      case "plaid":
        this.#provider = new PlaidProvider(params);
        break;
      case "enablebanking":
        this.#provider = new EnableBankingProvider(params);
        break;
      default:
    }
  }

  async getHealthCheck(
    params: Omit<ProviderParams, "provider">,
  ): Promise<GetHealthCheckResponse> {
    const teller = new TellerProvider(params);
    const plaid = new PlaidProvider(params);
    const gocardless = new GoCardLessProvider(params);
    const enablebanking = new EnableBankingProvider(params);

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
    logger(
      "getTransactions:",
      `provider: ${this.#name} id: ${params.accountId}`,
    );

    const data = await this.#provider?.getTransactions(params);

    if (data) {
      return data;
    }

    return [];
  }

  async getAccounts(params: GetAccountsRequest) {
    logger("getAccounts:", `provider: ${this.#name}`);

    const data = await this.#provider?.getAccounts(params);

    if (data) {
      return data;
    }

    return [];
  }

  async getAccountBalance(params: GetAccountBalanceRequest) {
    logger(
      "getAccountBalance:",
      `provider: ${this.#name} id: ${params.accountId}`,
    );

    const data = await this.#provider?.getAccountBalance(params);

    if (data) {
      return data;
    }

    return null;
  }

  async getInstitutions(params: GetInstitutionsRequest) {
    logger("getInstitutions:", `provider: ${this.#name}`);

    const data = await this.#provider?.getInstitutions(params);

    if (data) {
      return data;
    }

    return [];
  }

  async deleteAccounts(params: DeleteAccountsRequest) {
    logger("delete:", `provider: ${this.#name}`);

    return this.#provider?.deleteAccounts(params);
  }

  async getConnectionStatus(params: GetConnectionStatusRequest) {
    logger("getConnectionStatus:", `provider: ${this.#name}`);

    const data = await this.#provider?.getConnectionStatus(params);

    if (data) {
      return data;
    }

    return { status: "connected" };
  }

  async deleteConnection(params: DeleteConnectionRequest) {
    logger("deleteConnection:", `provider: ${this.#name}`);

    return this.#provider?.deleteConnection(params);
  }
}
