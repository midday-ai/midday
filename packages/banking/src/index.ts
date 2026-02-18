import { EnableBankingProvider } from "./providers/enablebanking/enablebanking-provider";
import { GoCardLessProvider } from "./providers/gocardless/gocardless-provider";
import { PlaidProvider } from "./providers/plaid/plaid-provider";
import { TellerProvider } from "./providers/teller/teller-provider";
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
import { logger } from "./utils/logger";

export class Provider {
  #name: string;

  #provider:
    | PlaidProvider
    | TellerProvider
    | GoCardLessProvider
    | EnableBankingProvider;

  constructor(params: ProviderParams) {
    this.#name = params.provider;

    switch (params.provider) {
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
      default: {
        const exhaustiveCheck: never = params.provider;
        throw new Error(`Unknown banking provider: ${exhaustiveCheck}`);
      }
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
    } catch (error) {
      logger.error("Health check failed", { error });
      throw error;
    }
  }

  async getTransactions(params: GetTransactionsRequest) {
    logger.info("getTransactions", {
      provider: this.#name,
      accountId: params.accountId,
    });

    return this.#provider.getTransactions(params);
  }

  async getAccounts(params: GetAccountsRequest) {
    logger.info("getAccounts", { provider: this.#name });

    return this.#provider.getAccounts(params);
  }

  async getAccountBalance(params: GetAccountBalanceRequest) {
    logger.info("getAccountBalance", {
      provider: this.#name,
      accountId: params.accountId,
    });

    return this.#provider.getAccountBalance(params);
  }

  async getInstitutions(params: GetInstitutionsRequest) {
    logger.info("getInstitutions", { provider: this.#name });

    return this.#provider.getInstitutions(params);
  }

  async deleteAccounts(params: DeleteAccountsRequest) {
    logger.info("deleteAccounts", { provider: this.#name });

    return this.#provider.deleteAccounts(params);
  }

  async getConnectionStatus(params: GetConnectionStatusRequest) {
    logger.info("getConnectionStatus", { provider: this.#name });

    return this.#provider.getConnectionStatus(params);
  }

  async deleteConnection(params: DeleteConnectionRequest) {
    logger.info("deleteConnection", { provider: this.#name });

    return this.#provider.deleteConnection(params);
  }
}

export type {
  FetchInstitutionsResult,
  InstitutionRecord,
} from "./institutions";
export { fetchAllInstitutions } from "./institutions";
export { EnableBankingApi } from "./providers/enablebanking/enablebanking-api";
export { GoCardLessApi } from "./providers/gocardless/gocardless-api";
export { PlaidApi } from "./providers/plaid/plaid-api";
export { TellerApi } from "./providers/teller/teller-api";
export { syncInstitutionLogos } from "./sync-logos";
// Re-export types, provider APIs, and institution sync
export type * from "./types";
export {
  createErrorResponse,
  getProviderErrorDetails,
  ProviderError,
} from "./utils/error";
export { getFileExtension, getLogoURL } from "./utils/logo";
export { getRates } from "./utils/rates";
