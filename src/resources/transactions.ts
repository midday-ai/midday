// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import * as Core from '@midday/engine-sdk/core';
import { APIResource } from '@midday/engine-sdk/resource';
import { isRequestOptions } from '@midday/engine-sdk/core';
import * as TransactionsAPI from '@midday/engine-sdk/resources/transactions';

export class Transactions extends APIResource {
  list(query?: TransactionListParams, options?: Core.RequestOptions): Core.APIPromise<Transaction>;
  list(options?: Core.RequestOptions): Core.APIPromise<Transaction>;
  list(
    query: TransactionListParams | Core.RequestOptions = {},
    options?: Core.RequestOptions,
  ): Core.APIPromise<Transaction> {
    if (isRequestOptions(query)) {
      return this.list({}, query);
    }
    return this._client.get('/v1/transactions', { query, ...options });
  }
}

export interface Transaction {
  data: Array<Transaction.Data>;
}

export namespace Transaction {
  export interface Data {
    id: string;

    currency: string;

    name: string;
  }
}

export interface TransactionListParams {
  /**
   * Get latest transactions
   */
  latest?: string;
}

export namespace Transactions {
  export import Transaction = TransactionsAPI.Transaction;
  export import TransactionListParams = TransactionsAPI.TransactionListParams;
}
