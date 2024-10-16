import { PLAID_COUNTRIES } from "@/utils/countries";
import { ProviderError } from "@/utils/error";
import { logger } from "@/utils/logger";
import { paginate } from "@/utils/paginate";
import { withRetry } from "@/utils/retry";
import { R2Bucket } from "@cloudflare/workers-types";
import {
  Configuration,
  type CountryCode,
  type ItemPublicTokenExchangeResponse,
  type LinkTokenCreateResponse,
  PlaidApi as PlaidBaseApi,
  PlaidEnvironments,
  type LinkTokenCreateRequest as PlaidLinkTokenCreateRequest,
  Products,
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
  GetRecurringTransactionsRequest,
  GetRecurringTransactionsResponse,
  GetStatementPdfRequest,
  GetStatementPdfResponse,
  GetStatementsRequest,
  GetStatementsResponse,
  GetStatusResponse,
  GetTransactionsRequest,
  GetTransactionsResponse,
  ItemPublicTokenExchangeRequest,
  LinkTokenCreateRequest,
  StatementMetadata,
} from "./types";
import { isError } from "./utils";

/**
 * PlaidApi class for interacting with the Plaid API.
 * This class provides methods to perform various operations such as
 * retrieving account information, transactions, statements, and more.
 */
export class PlaidApi {
  #client: PlaidBaseApi;
  #clientId: string;
  #clientSecret: string;
  #r2: R2Bucket;

  #countryCodes = PLAID_COUNTRIES as CountryCode[];

  /**
   * Creates an instance of PlaidApi.
   * @param {Omit<ProviderParams, "provider">} params - Configuration parameters for the Plaid API.
   */
  constructor(params: Omit<ProviderParams, "provider">) {
    this.#clientId = params.envs.PLAID_CLIENT_ID;
    this.#clientSecret = params.envs.PLAID_SECRET;
    this.#r2 = params.r2;

    console.log("Plaid client ID:", this.#clientId);
    console.log("Plaid secret length:", this.#clientSecret.length);

    this.#countryCodes = PLAID_COUNTRIES as CountryCode[];
    console.log("Country codes:", this.#countryCodes);

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

  /**
   * Checks the health status of the Plaid API.
   * @returns {Promise<boolean>} A promise that resolves to true if the API is healthy, false otherwise.
   */
  async getHealthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        "https://status.plaid.com/api/v2/status.json"
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

  /**
   * Retrieves the balance for a specific account.
   * @param {GetAccountBalanceRequest} params - The request parameters.
   * @returns {Promise<GetAccountBalanceResponse | undefined>} A promise that resolves to the account balance or undefined.
   * @throws {ProviderError} If an error occurs during the API call.
   */
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

  /**
   * Retrieves accounts associated with an access token and institution.
   * @param {GetAccountsRequest} params - The request parameters.
   * @returns {Promise<GetAccountsResponse | undefined>} A promise that resolves to the accounts information or undefined.
   * @throws {ProviderError} If an error occurs during the API call.
   */
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

  /**
   * Retrieves transactions for a specific account.
   * @param {GetTransactionsRequest} params - The request parameters.
   * @returns {Promise<GetTransactionsResponse | undefined>} A promise that resolves to the transactions or undefined.
   * @throws {ProviderError} If an error occurs during the API call.
   */
  async getTransactions({
    accessToken,
    accountId,
    latest,
    syncCursor,
    maxCalls = 10,
  }: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    let added: Array<Transaction> = [];
    let cursor = syncCursor;
    let hasMore = true;
    let callCount = 0;

    try {
      if (latest) {
        const { data } = await this.#client.transactionsSync({
          access_token: accessToken,
          count: 100,
          cursor,
        });

        added = added.concat(data.added);
        cursor = data.next_cursor;
        hasMore = data.has_more;
      } else {
        while (hasMore && callCount < maxCalls) {
          const { data } = await this.#client.transactionsSync({
            access_token: accessToken,
            cursor,
          });

          added = added.concat(data.added);
          hasMore = data.has_more;
          cursor = data.next_cursor;
          callCount++;
        }
      }

      // NOTE: Plaid transactions for all accounts
      // we need to filter based on the provided accountId and pending status
      const newlyAddedTxns = added
        .filter((transaction) => transaction.account_id === accountId)
        .filter((transaction) => !transaction.pending);

      return {
        added: newlyAddedTxns,
        cursor: cursor ?? "",
        hasMore: hasMore,
      };
    } catch (error) {
      const parsedError = isError(error);

      if (parsedError) {
        throw new ProviderError(parsedError);
      }

      // If it's not a known error type, throw a generic error
      throw new Error("An unknown error occurred while fetching transactions");
    }
  }

  /**
   * Creates a link token for Plaid Link initialization.
   * @param {LinkTokenCreateRequest} params - The request parameters.
   * @returns {Promise<import("axios").AxiosResponse<LinkTokenCreateResponse>>} A promise that resolves to the link token creation response.
   */
  async linkTokenCreate({
    userId,
    language = "en",
    accessToken,
  }: LinkTokenCreateRequest): Promise<
    import("axios").AxiosResponse<LinkTokenCreateResponse>
  > {
    const payload: PlaidLinkTokenCreateRequest = {
      client_id: this.#clientId,
      secret: this.#clientSecret,
      client_name: "simfiny",
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
    };

    console.log("Link token create payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await this.#client.linkTokenCreate(payload);
      console.log("Link token created successfully");
      return response;
    } catch (error: unknown) {
      console.error(
        "Error creating link token:",
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
  }

  /**
   * Retrieves information about a specific institution by its ID.
   * @param {string} institution_id - The ID of the institution.
   * @returns {Promise<any>} A promise that resolves to the institution information.
   */
  async institutionsGetById(institution_id: string) {
    return this.#client.institutionsGetById({
      institution_id,
      country_codes: this.#countryCodes,
      options: {
        include_auth_metadata: true,
      },
    });
  }

  /**
   * Exchanges a public token for an access token.
   * @param {ItemPublicTokenExchangeRequest} params - The request parameters.
   * @returns {Promise<import("axios").AxiosResponse<ItemPublicTokenExchangeResponse>>} A promise that resolves to the token exchange response.
   */
  async itemPublicTokenExchange({
    publicToken,
  }: ItemPublicTokenExchangeRequest): Promise<
    import("axios").AxiosResponse<ItemPublicTokenExchangeResponse>
  > {
    return this.#client.itemPublicTokenExchange({
      public_token: publicToken,
    });
  }

  /**
   * Deletes (disconnects) accounts associated with an access token.
   * @param {DisconnectAccountRequest} params - The request parameters.
   * @returns {Promise<void>} A promise that resolves when the accounts are deleted.
   */
  async deleteAccounts({
    accessToken,
  }: DisconnectAccountRequest): Promise<void> {
    await this.#client.itemRemove({
      access_token: accessToken,
    });
  }

  /**
   * Retrieves a list of institutions.
   * @param {GetInstitutionsRequest} [params] - Optional request parameters.
   * @returns {Promise<any>} A promise that resolves to the list of institutions.
   */
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
            })
        ),
    });
  }

  /**
   * Retrieves statements for an account.
   * @param {GetStatementsRequest} params - The request parameters.
   * @returns {Promise<GetStatementsResponse>} A promise that resolves to the statements information.
   * @throws {ProviderError} If an error occurs during the API call.
   */
  async getStatements({
    accessToken,
    accountId,
    userId,
    teamId,
  }: GetStatementsRequest): Promise<GetStatementsResponse> {
    try {
      const response = await this.#client.statementsList({
        access_token: accessToken,
      });

      const { accounts, institution_id, item_id, institution_name } =
        response.data;

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
          statementIdToAccountId.set(
            statement.statement_id,
            account.account_id
          );
        });

        // we need to store the statement id to account id
        allStatements.push(...account.statements);
      });

      // we construct and statements response object
      const statements: Array<StatementMetadata> = allStatements.map(
        (statement) => ({
          account_id: statementIdToAccountId.get(statement.statement_id) ?? "",
          statement_id: statement.statement_id,
          month: statement.month.toString(),
          year: statement.year.toString(),
        })
      );

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

  /**
   * Retrieves a PDF statement for an account.
   * @param {GetStatementPdfRequest} params - The request parameters.
   * @returns {Promise<GetStatementPdfResponse>} A promise that resolves to the PDF statement data.
   * @throws {ProviderError} If an error occurs during the API call.
   */
  async getStatementPdf({
    accessToken,
    statementId,
    accountId,
    userId,
    teamId,
  }: GetStatementPdfRequest): Promise<GetStatementPdfResponse> {
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

  /**
   * Retrieves recurring transactions for an account.
   * @param {GetRecurringTransactionsRequest} params - The request parameters.
   * @returns {Promise<GetRecurringTransactionsResponse | undefined>} A promise that resolves to the recurring transactions or undefined.
   * @throws {ProviderError} If an error occurs during the API call.
   */
  async getRecurringTransactions({
    accessToken,
    accountId,
  }: GetRecurringTransactionsRequest): Promise<
    GetRecurringTransactionsResponse | undefined
  > {
    try {
      const response = await this.#client.transactionsRecurringGet({
        access_token: accessToken,
        account_ids: [accountId],
        options: {
          include_personal_finance_category: true,
        },
      });

      return response.data;
    } catch (error) {
      const parsedError = isError(error);

      if (parsedError) {
        throw new ProviderError(parsedError);
      }
    }
  }
}
