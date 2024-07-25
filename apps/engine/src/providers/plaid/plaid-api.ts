import { PLAID_COUNTRIES } from "@/utils/countries";
import { logger } from "@/utils/logger";
import { paginate } from "@/utils/paginate";
import { withRetry } from "@/utils/retry";
import {
  Configuration,
  type CountryCode,
  type ItemPublicTokenExchangeResponse,
  type LinkTokenCreateResponse,
  PlaidApi as PlaidBaseApi,
  PlaidEnvironments,
  Products,
  type Transaction,
} from "plaid";
import type { GetInstitutionsRequest, ProviderParams } from "../types";
import type {
  DisconnectAccountRequest,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsRequest,
  GetAccountsResponse,
  GetStatusResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
  ItemPublicTokenExchangeRequest,
  LinkTokenCreateRequest,
} from "./types";

export class PlaidApi {
  #client: PlaidBaseApi;
  #clientId: string;
  #clientSecret: string;

  #countryCodes = PLAID_COUNTRIES as CountryCode[];

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#clientId = params.envs.PLAID_CLIENT_ID;
    this.#clientSecret = params.envs.PLAID_SECRET;

    const configuration = new Configuration({
      basePath:
        PlaidEnvironments[params.envs.PLAID_ENVIRONMENT || "production"],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": this.#clientId,
          "PLAID-SECRET": this.#clientSecret,
        },
      },
    });

    this.#client = new PlaidBaseApi(configuration);
  }

  async getHealthCheck() {
    try {
      const response = await fetch(
        "https://status.plaid.com/api/v2/status.json",
      );

      const data: GetStatusResponse = await response.json();

      return (
        data.status.indicator === "none" ||
        data.status.indicator === "maintenance"
      );
    } catch {
      return false;
    }
  }

  async getAccountBalance({
    accessToken,
    accountId,
  }: GetAccountBalanceRequest): Promise<GetAccountBalanceResponse | undefined> {
    const accounts = await this.#client.accountsGet({
      access_token: accessToken,
      options: {
        account_ids: [accountId],
      },
    });

    return accounts.data.accounts.at(0)?.balances;
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

    // NOTE: Plaid transactions for all accounts
    // we need to filter based on the provided accountId
    return added.filter((transaction) => transaction.account_id === accountId);
  }

  async linkTokenCreate({
    userId,
    language = "en",
    accessToken,
  }: LinkTokenCreateRequest): Promise<
    import("axios").AxiosResponse<LinkTokenCreateResponse>
  > {
    return this.#client.linkTokenCreate({
      client_id: this.#clientId,
      secret: this.#clientSecret,
      client_name: "Midday",
      products: [Products.Transactions],
      language,
      access_token: accessToken,
      country_codes: this.#countryCodes,
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
      country_codes: this.#countryCodes,
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

  async deleteAccounts({ accessToken }: DisconnectAccountRequest) {
    await this.#client.itemRemove({
      access_token: accessToken,
    });
  }

  async getInstitutions(params?: GetInstitutionsRequest) {
    const countryCode = params?.countryCode
      ? [params.countryCode as CountryCode]
      : this.#countryCodes;

    return paginate({
      delay: { milliseconds: 100, onDelay: (message) => logger(message) },
      pageSize: 500,
      fetchData: (offset, count) =>
        withRetry(() =>
          this.#client
            .institutionsGet({
              country_codes: countryCode,
              count,
              offset,
              options: {
                include_optional_metadata: true,
                products: [Products.Transactions],
              },
            })
            .then(({ data }) => {
              return data.institutions;
            }),
        ),
    });
  }
}
