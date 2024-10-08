import { Providers } from "@/common/schema";
import { logger } from "@/utils/logger";
import { withRetry } from "@/utils/retry";
import { GoCardLessProvider } from "./gocardless/gocardless-provider";
import { PlaidProvider } from "./plaid/plaid-provider";
import { StripeApi } from "./stripe/stripe-api";
import { StripeProvider } from "./stripe/stripe-provider";
import { TellerProvider } from "./teller/teller-provider";
import type {
  DeleteAccountsRequest,
  GetAccountBalanceRequest,
  GetAccountsRequest,
  GetHealthCheckResponse,
  GetInstitutionsRequest,
  GetRecurringTransactionsRequest,
  GetStatementPdfRequest,
  GetStatementPdfResponse,
  GetStatementsRequest,
  GetStatementsResponse,
  GetTransactionsRequest,
  ProviderParams,
} from "./types";

export class Provider {
  #name?: string;
  #provider:
    | PlaidProvider
    | TellerProvider
    | GoCardLessProvider
    | StripeProvider
    | null = null;

  constructor(params?: ProviderParams) {
    this.#name = params?.provider;

    switch (params?.provider) {
      case Providers.Enum.gocardless:
        this.#provider = new GoCardLessProvider(params);
        break;
      case Providers.Enum.teller:
        this.#provider = new TellerProvider(params);
        break;
      case Providers.Enum.plaid:
        this.#provider = new PlaidProvider(params);
        break;
      case Providers.Enum.stripe:
        this.#provider = new StripeProvider(params);
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
    if (!this.#provider) {
      throw new Error(`Invalid provider: ${this.#name}`);
    }
    return this.#provider.getTransactions(params);
  }

  async getAccounts(params: GetAccountsRequest) {
    logger("getAccounts:", `provider: ${this.#name}`);

    const data = await withRetry(() => this.#provider?.getAccounts(params));

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

    const data = await withRetry(() =>
      this.#provider?.getAccountBalance(params),
    );

    if (data) {
      return data;
    }

    return null;
  }

  async getInstitutions(params: GetInstitutionsRequest) {
    logger("getInstitutions:", `provider: ${this.#name}`);

    const data = await withRetry(() => this.#provider?.getInstitutions(params));

    if (data) {
      return data;
    }

    return [];
  }

  async deleteAccounts(params: DeleteAccountsRequest) {
    logger("delete:", `provider: ${this.#name}`);

    return withRetry(() => this.#provider?.deleteAccounts(params));
  }

  async getStatements(
    params: GetStatementsRequest,
  ): Promise<GetStatementsResponse> {
    logger("getStatements:", `provider: ${this.#name}`);

    const data = await withRetry(() => this.#provider?.getStatements(params));

    if (data) {
      return data;
    }

    return {
      statements: [],
      institution_name: "",
      institution_id: "",
    };
  }

  async getStatementPdf(
    params: GetStatementPdfRequest,
  ): Promise<GetStatementPdfResponse> {
    logger("getStatementPdf:", `provider: ${this.#name}`);

    const data = await withRetry(() => this.#provider?.getStatementPdf(params));

    if (data) {
      return data;
    }

    throw new Error("Statement PDF not supported for this provider");
  }

  /**
   * Retrieves recurring transactions for the specified parameters.
   * @param {GetRecurringTransactionsRequest} params - Parameters for the recurring transactions request.
   * @returns {Promise<{ inflow: any[], outflow: any[], last_updated_at: string }>} A promise that resolves to an object containing inflow and outflow transactions, and the last update timestamp.
   */
  async getRecurringTransactions(params: GetRecurringTransactionsRequest) {
    logger("getRecurringTransactions:", `provider: ${this.#name}`);

    const data = await withRetry(() =>
      this.#provider?.getRecurringTransactions(params),
    );

    if (data) {
      return data;
    }

    return {
      inflow: [],
      outflow: [],
      last_updated_at: new Date().toISOString(),
    };
  }
}
