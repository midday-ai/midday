// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import * as Core from 'midday/core';
import { APIResource } from 'midday/resource';
import { isRequestOptions } from 'midday/core';
import * as AccountsAPI from 'midday/resources/accounts';

export class Accounts extends APIResource {
  list(query?: AccountListParams, options?: Core.RequestOptions): Core.APIPromise<Account>;
  list(options?: Core.RequestOptions): Core.APIPromise<Account>;
  list(
    query: AccountListParams | Core.RequestOptions = {},
    options?: Core.RequestOptions,
  ): Core.APIPromise<Account> {
    if (isRequestOptions(query)) {
      return this.list({}, query);
    }
    return this._client.get('/v1/accounts', { query, ...options });
  }
}

export interface Account {
  data: Array<Account.Data>;
}

export namespace Account {
  export interface Data {
    id: string;

    currency: string;

    enrollment_id: string | null;

    institution: Data.Institution;

    name: string;

    provider: 'teller' | 'plaid' | 'gocardless';
  }

  export namespace Data {
    export interface Institution {
      id: string;

      logo: string | null;

      name: string;
    }
  }
}

export interface AccountListParams {
  /**
   * GoCardLess account id
   */
  id?: string;

  /**
   * Teller & Plaid access token
   */
  accessToken?: string;

  /**
   * GoCardLess country code
   */
  countryCode?: string;

  /**
   * Plaid institution id
   */
  institutionId?: string;
}

export namespace Accounts {
  export import Account = AccountsAPI.Account;
  export import AccountListParams = AccountsAPI.AccountListParams;
}
