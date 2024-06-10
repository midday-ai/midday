import { GoCardLessProvider } from "./gocardless/gocardless-provider";
import { PlaidProvider } from "./plaid/plaid-provider";
import { TellerProvider } from "./teller/teller-provider";
import type {
  DeleteAccountRequest,
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
    params: ProviderParams
  ): Promise<GetHealthCheckResponse> {
    const teller = new TellerProvider(params);
    const plaid = new PlaidProvider(params);
    const gocardless = new GoCardLessProvider(params);

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
  }

  async getTransactions(params: GetTransactionsRequest) {
    return this.#provider?.getTransactions(params);
  }

  async getAccounts(params: GetAccountsRequest) {
    return this.#provider?.getAccounts(params);
  }

  async getAccountBalance(params: GetAccountBalanceRequest) {
    return this.#provider?.getAccountBalance(params);
  }

  // async deleteAccount(params: DeleteAccountRequest) {
  //   return this.#provider?.deleteAccount(params);
  // }
}
