import { PLAID_COUNTRIES } from "@engine/utils/countries";
import { ProviderError } from "@engine/utils/error";
import { logger } from "@engine/utils/logger";
import { paginate } from "@engine/utils/paginate";
import { withRetry } from "@engine/utils/retry";
import { formatISO, subDays } from "date-fns";
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
import type {
  ConnectionStatus,
  GetInstitutionsRequest,
  ProviderParams,
} from "../types";
import type {
  DisconnectAccountRequest,
  GetAccountBalanceRequest,
  GetAccountBalanceResponse,
  GetAccountsRequest,
  GetAccountsResponse,
  GetConnectionStatusRequest,
  GetStatusResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
  ItemPublicTokenExchangeRequest,
  LinkTokenCreateRequest,
} from "./types";
import { isError } from "./utils";

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

  #generateWebhookUrl(environment: "sandbox" | "production") {
    if (environment === "sandbox") {
      return "https://staging.app.midday.ai/api/webhook/plaid";
    }

    return "https://app.midday.ai/api/webhook/plaid";
  }

  async getHealthCheck() {
    try {
      const response = await fetch(
        "https://status.plaid.com/api/v2/status.json",
      );

      const data = (await response.json()) as GetStatusResponse;

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
    try {
      const accounts = await this.#client.accountsGet({
        access_token: accessToken,
        options: {
          account_ids: [accountId],
        },
      });

      return accounts.data.accounts.at(0)?.balances;
    } catch (error) {
      const parsedError = isError(error);

      if (parsedError) {
        throw new ProviderError(parsedError);
      }
    }
  }

  async getAccounts({
    accessToken,
    institutionId,
  }: GetAccountsRequest): Promise<GetAccountsResponse | undefined> {
    try {
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
    } catch (error) {
      const parsedError = isError(error);

      if (parsedError) {
        throw new ProviderError(parsedError);
      }
    }
  }

  async getTransactions({
    accessToken,
    accountId,
    latest,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse | undefined> {
    try {
      let transactions: Array<Transaction> = [];

      if (latest) {
        // Get transactions from the last 5 days using /transactions/get
        const { data } = await this.#client.transactionsGet({
          access_token: accessToken,
          start_date: formatISO(subDays(new Date(), 5), {
            representation: "date",
          }),
          end_date: formatISO(new Date(), {
            representation: "date",
          }),
        });

        transactions = data.transactions;
      } else {
        // Get all transactions using /transactions/sync
        let cursor = undefined;
        let hasMore = true;

        while (hasMore) {
          const { data } = await this.#client.transactionsSync({
            access_token: accessToken,
            cursor,
          });

          transactions = transactions.concat(data.added);
          hasMore = data.has_more;
          cursor = data.next_cursor;
        }
      }

      // NOTE: Plaid transactions for all accounts
      // we need to filter based on the provided accountId and pending status
      return transactions
        .filter((transaction) => transaction.account_id === accountId)
        .filter((transaction) => !transaction.pending);
    } catch (error) {
      const parsedError = isError(error);

      if (parsedError) {
        throw new ProviderError(parsedError);
      }
    }
  }

  async linkTokenCreate({
    userId,
    language = "en",
    accessToken,
    environment = "production",
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
      webhook: this.#generateWebhookUrl(environment),
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

  async getConnectionStatus({
    accessToken,
  }: GetConnectionStatusRequest): Promise<ConnectionStatus> {
    try {
      await this.#client.accountsGet({
        access_token: accessToken,
      });

      return { status: "connected" };
    } catch (error) {
      const parsedError = isError(error);

      if (parsedError) {
        const providerError = new ProviderError(parsedError);

        if (providerError.code === "disconnected") {
          return { status: "disconnected" };
        }
      }

      // If we get here, the account is not disconnected
      // But it could be a connection issue between Plaid and the institution
      return { status: "connected" };
    }
  }
}
