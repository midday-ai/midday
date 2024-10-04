import { PLAID_COUNTRIES } from "@/utils/countries";
import { ProviderError } from "@/utils/error";
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
  StatementsAccount,
  StatementsStatement,
  StatementsAccount,
  StatementsStatement,
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
  GetStatementsRequest,
  GetStatementsResponse,
  GetStatementPdfRequest,
  GetStatementPdfResponse,
  StatementMetadata,
  GetStatementsRequest,
  GetStatementsResponse,
  GetStatementPdfRequest,
  GetStatementPdfResponse,
  StatementMetadata,
} from "./types";
import { isError } from "./utils";
import { R2Bucket } from '@cloudflare/workers-types';
import { R2Bucket } from '@cloudflare/workers-types';

export class PlaidApi {
  #client: PlaidBaseApi;
  #clientId: string;
  #clientSecret: string;
  #r2: R2Bucket;
  #r2: R2Bucket;

  #countryCodes = PLAID_COUNTRIES as CountryCode[];

  constructor(params: Omit<ProviderParams, "provider">) {
    this.#clientId = params.envs.PLAID_CLIENT_ID;
    this.#clientSecret = params.envs.PLAID_SECRET;
    this.#r2 = params.r2;
    this.#r2 = params.r2;

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
    let added: Array<Transaction> = [];
    let cursor = undefined;
    let hasMore = true;
    try {
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
      // we need to filter based on the provided accountId and pending status
      return added
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

  async getStatements({ accessToken, accountId, userId, teamId }: GetStatementsRequest): Promise<GetStatementsResponse> {
    try {
      const response = await this.#client.statementsList({
        access_token: accessToken,
      });

      const {
        accounts,
        institution_id,
        item_id,
        institution_name,
      } = response.data;

      // get the account is and create a hashmap of accountId to account
      const accountIdToAccount = new Map<string, StatementsAccount>();
      const accountIdToStatements = new Map<string, StatementsStatement>();
      const allStatements: StatementsStatement[] = [];
      const statementIdToAccountId = new Map<string, string>();

      // populate the hashmap
      accounts.forEach((account) => {
        // we need to store the account id to account object
        accountIdToAccount.set(account.account_id, account);

        // we need to store the statement id to statement object
        account.statements.forEach((statement) => {
          accountIdToStatements.set(statement.statement_id, statement);
          statementIdToAccountId.set(statement.statement_id, account.account_id);
        });

        // we need to store the statement id to account id
        allStatements.push(...account.statements);
      });

      // we construct and statements response object
      const statements: Array<StatementMetadata> = allStatements.map((statement) => ({
        account_id: statementIdToAccountId.get(statement.statement_id) ?? "",
        statement_id: statement.statement_id,
        month: statement.month.toString(),
        year: statement.year.toString(),
      }));

      return {
        statements,
        institution_name,
        item_id,
        institution_id,
      };
    } catch (error) {
      const parsedError = isError(error);
      if (parsedError) {
        throw new ProviderError(parsedError);
      }
      throw error;
    }
  }

  async getStatementPdf({ accessToken, statementId, accountId, userId, teamId }: GetStatementPdfRequest): Promise<GetStatementPdfResponse> {
    try {
      const key = `statement_${teamId}_${userId}_${accountId}_${statementId}.pdf`;

      // Check if PDF is already in R2
      const storedPdf = await this.#r2.get(key);
      if (storedPdf) {
        return {
          pdf: Buffer.from(await storedPdf.arrayBuffer()),
          filename: `statement_${statementId}.pdf`,
        };
      }

      // If not in R2, fetch from Plaid
      const response = await this.#client.statementsDownload({
        access_token: accessToken,
        statement_id: statementId,
      });

      // Store PDF in R2
      await this.#r2.put(key, response.data.pdf);

      return {
        pdf: response.data.pdf,
        filename: response.data.filename,
      };
    } catch (error) {
      const parsedError = isError(error);
      if (parsedError) {
        throw new ProviderError(parsedError);
      }
      throw error;
    }
  }
}
