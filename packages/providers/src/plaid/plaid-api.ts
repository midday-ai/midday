import {
  Configuration,
  CountryCode,
  type ItemPublicTokenExchangeResponse,
  type LinkTokenCreateResponse,
  PlaidApi as PlaidBaseApi,
  PlaidEnvironments,
  Products,
  type Transaction,
} from "plaid";
import type {
  GetAccountsRequest,
  GetAccountsResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
  ItemPublicTokenExchangeRequest,
  LinkTokenCreateRequest,
} from "./types";

export class PlaidApi {
  #client: PlaidBaseApi;

  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments[process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT!],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
          "PLAID-SECRET": process.env.PLAID_SECRET,
        },
      },
    });

    this.#client = new PlaidBaseApi(configuration);
  }

  async getAccounts({
    accessToken,
    institutionId,
  }: GetAccountsRequest): Promise<GetAccountsResponse> {
    const accounts = await this.#client.accountsGet({
      access_token: accessToken,
    });

    const institution = await this.institutionsGetById(institutionId);
    return accounts.data.accounts.map((account) => ({
      ...account,
      institution: {
        id: institution.data.institution.institution_id,
        name: institution.data.institution.name,
        // NOTE: Currently not in use, base64 and usually unavailable
        logo: institution.data.institution?.logo ?? null,
      },
    }));
  }

  async getTransactions({
    accessToken,
    accountId,
    latest,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    let added: Array<Transaction> = [];
    let cursor = undefined;
    let hasMore = true;

    if (latest) {
      const { data } = await this.#client.transactionsSync({
        access_token: accessToken,
        count: 500,
      });

      added = added.concat(data.added);
    } else {
      while (hasMore) {
        const { data } = await this.#client.transactionsSync({
          access_token: accessToken,
          cursor,
        });

        added = added.concat(data.added);
        hasMore = data.has_more;
        cursor = data.next_cursor;
      }
    }
    // NOTE: Plaid transactions for all accounts, we need to filter based on the
    // Provided accountId
    return (
      added
        .filter((transaction) => transaction.account_id === accountId)
        // NOTE: Remove pending transactions until upsert issue is fixed
        .filter((transaction) => !transaction.pending)
    );
  }

  async linkTokenCreate({
    userId,
  }: LinkTokenCreateRequest): Promise<
    import("axios").AxiosResponse<LinkTokenCreateResponse>
  > {
    return this.#client.linkTokenCreate({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      client_name: "Midday",
      products: [Products.Transactions],
      // TODO: Update language based on user preference
      language: "en",
      country_codes: [
        CountryCode.Ca,
        CountryCode.Us,
        // CountryCode.Se,
        // CountryCode.Nl,
        // CountryCode.Be,
        // CountryCode.Gb,
        // CountryCode.Es,
        // CountryCode.Fr,
        // CountryCode.Ie,
        // CountryCode.De,
        // CountryCode.It,
        // CountryCode.Pl,
        // CountryCode.Dk,
        // CountryCode.No,
        // CountryCode.Ee,
        // CountryCode.Lt,
        // CountryCode.Lv,
        // CountryCode.Pt,
      ],
      transactions: {
        days_requested: 730,
      },
      user: {
        client_user_id: userId,
      },
    });
  }

  async institutionsGetById(institution_id: string) {
    return this.#client.institutionsGetById({
      institution_id,
      country_codes: [CountryCode.Ca, CountryCode.Us],
      options: {
        include_auth_metadata: true,
      },
    });
  }

  async itemPublicTokenExchange({
    publicToken,
  }: ItemPublicTokenExchangeRequest): Promise<
    import("axios").AxiosResponse<ItemPublicTokenExchangeResponse>
  > {
    return this.#client.itemPublicTokenExchange({
      public_token: publicToken,
    });
  }
}
