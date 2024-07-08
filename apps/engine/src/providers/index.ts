import { logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { GoCardLessProvider } from "./gocardless/gocardless-provider";
import { PlaidProvider } from "./plaid/plaid-provider";
import { TellerProvider } from "./teller/teller-provider";
import type {
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetHealthCheckResponse,
  GetTransactionsRequest,
  ProviderParams,
} from "./types";

export class Provider {
  #provider: PlaidProvider | TellerProvider | GoCardLessProvider | null = null;

  constructor(params?: ProviderParams) {
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
      default:
    }
  }

  async getHealthCheck(
    params: Omit<ProviderParams, "provider">
  ): Promise<GetHealthCheckResponse> {
    const teller = new TellerProvider(params);
    const plaid = new PlaidProvider(params);
    const gocardless = new GoCardLessProvider(params);

    try {
      const [isPlaidHealthy, isGocardlessHealthy, isTellerHealthy] =
        await Promise.all([
          plaid.getHealthCheck(),
          gocardless.getHealthCheck(),
          teller.getHealthCheck(),
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
      };
    } catch {
      throw Error("Something went wrong");
    }
  }

  async getTransactions(params: GetTransactionsRequest) {
    logger(
      "getTransactions:",
      `provider: ${this.#provider} id: ${params.accountId}`
    );

    const data = await withRetry(() => this.#provider?.getTransactions(params));

    if (data) {
      return data;
    }

    return [];
  }

  async getAccounts(params: GetAccountsRequest) {
    logger("getAccounts:", `provider: ${this.#provider}`);

    const data = await withRetry(() => this.#provider?.getAccounts(params));

    if (data) {
      return data;
    }

    return [];
  }

  async getAccountBalance(params: GetAccountBalanceRequest) {
    logger(
      "getAccountBalance:",
      `provider: ${this.#provider} id: ${params.accountId}`
    );

    const data = await withRetry(() =>
      this.#provider?.getAccountBalance(params)
    );

    if (data) {
      return data;
    }

    return null;
  }

  async getInstitutions(params: GetAccountsRequest) {
    logger("getInstitutions:", `provider: ${this.#provider}`);

    const data = await withRetry(() => this.#provider?.getInstitutions(params));

    if (data) {
      return data;
    }

    return [];
  }
}
