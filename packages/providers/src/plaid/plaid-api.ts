import {
  Configuration,
  CountryCode,
  ItemPublicTokenExchangeResponse,
  LinkTokenCreateResponse,
  PlaidApi as PlaidBaseApi,
  PlaidEnvironments,
  Products,
  TransactionsSyncResponse,
} from "plaid";
import {
  GetAccountsRequest,
  GetAccountsResponse,
  GetTransactionsRequest,
  ItemPublicTokenExchangeRequest,
  LinkTokenCreateRequest,
} from "./types";

export class PlaidApi {
  #client: PlaidBaseApi;

  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments.sandbox,
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
        website: institution.data.institution?.url ?? null,
      },
    }));
  }

  async getTransactions({
    accessToken,
  }: GetTransactionsRequest): Promise<
    import("axios").AxiosResponse<TransactionsSyncResponse>
  > {
    return this.#client.transactionsSync({
      access_token: accessToken,
    });
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
      language: "en",
      country_codes: [CountryCode.Ca, CountryCode.Us],
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
