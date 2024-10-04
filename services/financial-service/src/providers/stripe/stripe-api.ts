import { ProviderError } from '@/utils/error';
import { Stripe } from 'stripe';
import type { GetTransactionsRequest, GetTransactionsResponse, ProviderParams } from '../types';

/**
 * StripeApi class for interacting with the Stripe API.
 * This class provides methods to retrieve transactions and perform health checks.
 */
export class StripeApi {
  /** Private Stripe client instance */
  #client: Stripe;

  /**
   * Creates a new StripeApi instance.
   * @param params - Configuration parameters for the Stripe API.
   * @param params.envs.STRIPE_SECRET_KEY - The Stripe secret key for authentication.
   */
  constructor(params: Omit<ProviderParams, "provider">) {
    this.#client = new Stripe(params.envs.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }

  /**
   * Retrieves transactions for a specified Stripe account.
   * @param options - Options for retrieving transactions.
   * @param options.accountId - The Stripe account holder reference.
   * @param options.latest - If true, retrieves only the most recent transactions.
   * @returns A promise that resolves to an array of formatted transaction objects or undefined.
   * @throws {ProviderError} If an error occurs during the API call or data processing.
   */
  async getTransactions({
    accountId, // This will be the Stripe account holder reference
    latest,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse | undefined> {
    try {
      const limit = latest ? 100 : 1000;
      const balanceTransactions = await this.#client.balanceTransactions.list({
        limit,
      }, {
        stripeAccount: accountId,
      });

      return balanceTransactions.data.map(transaction => ({
        id: transaction.id,
        amount: transaction.amount / 100,
        currency: transaction.currency,
        date: new Date(transaction.created * 1000).toISOString().split('T')[0],
        account_id: accountId,
        status: 'posted',
        balance: null,
        category: transaction.type,
        method: transaction.type,
        name: transaction.description || 'Stripe Transaction',
        description: transaction.description,
        currency_rate: null,
        currency_source: null,
        internal_id: transaction.id,
        bank_account_id: accountId,
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new ProviderError({
          message: error.message,
          code: 'STRIPE_ERROR',
        });
      }
      throw new ProviderError({
        message: 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
      });
    }
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
