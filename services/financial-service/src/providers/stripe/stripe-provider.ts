import { ProviderError } from "@/utils/error";
import { Stripe } from "stripe";
import type {
  DeleteAccountsRequest,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsRequest,
  GetAccountsResponse,
  GetInstitutionsRequest,
  GetInstitutionsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
  ProviderParams,
} from "../types";
import {
  transformAccount,
  transformAccountBalance,
  transformTransaction,
} from "./transform";

/**
 * StripeProvider class for interacting with the Stripe API.
 * This class provides methods to retrieve transactions, accounts, balances,
 * and perform other Stripe-related operations.
 */
export class StripeProvider {
  #client: Stripe;

  /**
   * Creates a new instance of the StripeProvider.
   * @param params - Configuration parameters for the provider.
   */
  constructor(params: Omit<ProviderParams, "provider">) {
    this.#client = new Stripe(params.envs.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });
  }

  /**
   * Retrieves transactions for a given Stripe account.
   * @param accountId - The ID of the Stripe account.
   * @param latest - If true, retrieves only the latest transactions (limited to 100).
   * @returns A promise that resolves to an array of transformed transactions.
   * @throws {ProviderError} If there's an error retrieving the transactions.
   */
  async getTransactions({
    accountId,
    latest,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    try {
      const limit = latest ? 100 : 1000;
      const balanceTransactions = await this.#client.balanceTransactions.list(
        { limit },
        { stripeAccount: accountId },
      );

      return balanceTransactions.data.map((transaction) =>
        transformTransaction({ transaction, accountId }),
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new ProviderError({
          message: error.message,
          code: "STRIPE_ERROR",
        });
      }
      throw new ProviderError({
        message: "Unknown error occurred",
        code: "UNKNOWN_ERROR",
      });
    }
  }

  /**
   * Retrieves account information for a given Stripe account.
   * @param stripeAccountId - The ID of the Stripe account.
   * @returns A promise that resolves to an array containing the transformed account information.
   * @throws {ProviderError} If there's an error retrieving the account information.
   */
  async getAccounts({
    stripeAccountId,
  }: GetAccountsRequest): Promise<GetAccountsResponse> {
    try {
      const [account, balance] = await Promise.all([
        this.#client.accounts.retrieve({ stripeAccount: stripeAccountId }),
        this.#client.balance.retrieve({ stripeAccount: stripeAccountId }),
      ]);

      // TODO: Handle Stripe accounts that are not connected to a balance
      return [transformAccount({ account, balance })];
    } catch (error) {
      if (error instanceof Error) {
        throw new ProviderError({
          message: error.message,
          code: "STRIPE_ERROR",
        });
      }
      throw new ProviderError({
        message: "Unknown error occurred",
        code: "UNKNOWN_ERROR",
      });
    }
  }

  /**
   * Retrieves the balance for a given Stripe account.
   * @param accountId - The ID of the Stripe account.
   * @returns A promise that resolves to the transformed account balance.
   * @throws {ProviderError} If there's an error retrieving the account balance.
   */
  async getAccountBalance({
    accountId,
  }: GetAccountBalanceRequest): Promise<GetAccountBalanceResponse> {
    try {
      const balance = await this.#client.balance.retrieve({
        stripeAccount: accountId,
      });
      return transformAccountBalance(balance);
    } catch (error) {
      if (error instanceof Error) {
        throw new ProviderError({
          message: error.message,
          code: "STRIPE_ERROR",
        });
      }
      throw new ProviderError({
        message: "Unknown error occurred",
        code: "UNKNOWN_ERROR",
      });
    }
  }

  /**
   * Retrieves institution information for Stripe.
   * Note: Stripe doesn't have a concept of institutions like other providers.
   * @returns A promise that resolves to an array containing Stripe's institution information.
   */
  async getInstitutions(
    _params: GetInstitutionsRequest,
  ): Promise<GetInstitutionsResponse> {
    // Stripe doesn't have a concept of institutions like other providers
    return [
      {
        id: "stripe",
        name: "Stripe",
        logo: "https://stripe.com/img/v3/home/twitter.png",
        provider: "stripe",
      },
    ];
  }

  /**
   * Attempts to delete Stripe accounts.
   * Note: Stripe doesn't support deleting accounts via API.
   * @throws {ProviderError} Always throws an error indicating the operation is not supported.
   */
  async deleteAccounts(_params: DeleteAccountsRequest): Promise<void> {
    // Stripe doesn't support deleting accounts via API
    throw new ProviderError({
      message: "Deleting Stripe accounts is not supported",
      code: "OPERATION_NOT_SUPPORTED",
    });
  }

  /**
   * Performs a health check on the Stripe API connection.
   * @returns A promise that resolves to true if the health check is successful, false otherwise.
   */
  async getHealthCheck(): Promise<boolean> {
    try {
      await this.#client.balance.retrieve();
      return true;
    } catch {
      return false;
    }
  }
}
