// import {
//   AuthenticatedRequest,
//   GetAccountBalancesRequest,
//   GetAccountBalancesResponse,
//   GetAccountsResponse,
//   GetTransactionsRequest,
//   GetTransactionsResponse,
// } from "./types";
import {
  Configuration,
  CountryCode,
  type ItemPublicTokenExchangeRequest,
  PlaidApi as PlaidBaseApi,
  PlaidEnvironments,
  Products,
} from "plaid";

export class PlaidApi {
  #client: PlaidBaseApi;

  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.CLIENT_ID,
          "PLAID-SECRET": process.env.SECRET,
        },
      },
    });

    this.#client = new PlaidBaseApi(configuration);
  }

  async getAccounts({
    accessToken,
    accountId,
  }: AuthenticatedRequest): Promise<GetAccountsResponse> {
    return this.#client.accountsGet({
      access_token: accessToken,
      options: {
        account_ids: [accountId],
      },
    });
  }

  async getTransactions({
    accessToken,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    return this.#client.transactionsSync({
      access_token: accessToken,
    });
  }

  async linkTokenCreate({ userId }) {
    return this.#client.linkTokenCreate({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      client_name: "Midday",
      products: [Products.Auth, Products.Transactions],
      language: "en",
      country_codes: [CountryCode.Ca, CountryCode.Us],
      user: {
        client_user_id: new Date().getTime().toString(),
      },
    });
  }

  async itemPublicTokenExchange({
    publicToken,
  }: ItemPublicTokenExchangeRequest) {
    return this.#client.itemPublicTokenExchange({
      public_token: publicToken,
    });
  }
}
