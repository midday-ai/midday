import type { AccountType } from "@/utils/account";
import type {
  AccountsGetResponse,
  Institution as BaseInstitution,
  Transaction,
  TransactionsRecurringGetResponse,
  TransactionsSyncResponse,
  TransactionStream,
} from "plaid";

/**
 * Request parameters for creating a link token.
 */
export type LinkTokenCreateRequest = {
  /** The unique identifier of the user. */
  userId: string;
  /** The language code for the link interface. */
  language?: string;
  /** An existing access token for updating an Item. */
  accessToken?: string;
};

/**
 * Response structure for getting the status of the Plaid API.
 */
export type GetStatusResponse = {
  /** Information about the status page. */
  page: {
    /** Unique identifier for the status page. */
    id: string;
    /** Name of the status page. */
    name: string;
    /** URL of the status page. */
    url: string;
    /** Time zone of the status page. */
    time_zone: string;
    /** Last update timestamp of the status page. */
    updated_at: string;
  };
  /** Current status information. */
  status: {
    /** Indicator of the current status (e.g., "normal", "critical"). */
    indicator: string;
    /** Description of the current status. */
    description: string;
  };
};

/**
 * Request parameters for fetching transactions.
 */
export type GetTransactionsRequest = {
  /** The access token for the user's financial institution. */
  accessToken: string;
  /** The ID of the account to fetch transactions for. */
  accountId: string;
  /** If true, fetch only the latest transactions. */
  latest?: boolean;
  /** The type of the account. */
  syncCursor?: string;
};

/**
 * Request parameters for fetching accounts.
 */
export type GetAccountsRequest = {
  /** The access token for the user's financial institution. */
  accessToken: string;
  /** The ID of the institution to fetch accounts for. */
  institutionId: string;
};

/**
 * Request parameters for exchanging a public token for an access token.
 */
export type ItemPublicTokenExchangeRequest = {
  /** The public token received from the Plaid Link flow. */
  publicToken: string;
};

/**
 * Represents a financial institution.
 */
export type Institution = {
  /** Unique identifier for the institution. */
  id: string;
  /** Name of the institution. */
  name: string;
  /** URL of the institution's logo, if available. */
  logo?: string | null;
};

export type TransformInstitution = BaseInstitution;

export type AccountWithInstitution = AccountsGetResponse["accounts"][0] & {
  institution: Institution;
};

export type GetAccountsResponse = AccountWithInstitution[];

export type TransformAccount = AccountWithInstitution;

export type TransformAccountBalance =
  AccountsGetResponse["accounts"][0]["balances"];

export type TransformTransaction = Transaction;

export type GetTransactionsResponse = {
  added: TransactionsSyncResponse["added"]
  cursor: TransactionsSyncResponse["next_cursor"];
  hasMore: TransactionsSyncResponse["has_more"];
};

export type GetAccountBalanceResponse =
  AccountsGetResponse["accounts"][0]["balances"];

export interface GetAccountBalanceRequest {
  accessToken: string;
  accountId: string;
}

export type TransformTransactionPayload = {
  transaction: TransformTransaction;
  accountType: AccountType;
};

/**
 * Request parameters for disconnecting an account.
 */
export type DisconnectAccountRequest = {
  /** The access token for the account to be disconnected. */
  accessToken: string;
};

/**
 * Request parameters for fetching statements.
 */
export type GetStatementsRequest = {
  /** The access token for the user's financial institution. */
  accessToken: string;
  /** The ID of the account to fetch statements for. */
  accountId: string;
  /** The unique identifier of the user. */
  userId: string;
  /** The unique identifier of the team. */
  teamId: string;
};

/**
 * Metadata for a single statement.
 */
export type StatementMetadata = {
  /** The ID of the account the statement belongs to. */
  account_id: string;
  /** Unique identifier for the statement. */
  statement_id: string;
  /** The month of the statement (e.g., "01" for January). */
  month: string;
  /** The year of the statement (e.g., "2023"). */
  year: string;
};

/**
 * Response structure for fetching statements.
 */
export type GetStatementsResponse = {
  /** Array of statement metadata. */
  statements: StatementMetadata[];
  /** Name of the financial institution. */
  institution_name: string;
  /** Unique identifier for the item in Plaid. */
  item_id: string;
  /** Unique identifier for the institution in Plaid. */
  institution_id: string;
};

/**
 * Request parameters for fetching a statement PDF.
 */
export type GetStatementPdfRequest = {
  /** The access token for the user's financial institution. */
  accessToken: string;
  /** The ID of the statement to fetch. */
  statementId: string;
  /** The ID of the account the statement belongs to. */
  accountId: string;
  /** The unique identifier of the user. */
  userId: string;
  /** The unique identifier of the team. */
  teamId: string;
};

/**
 * Response structure for fetching a statement PDF.
 */
export type GetStatementPdfResponse = {
  /** The PDF file as a Buffer. */
  pdf: Buffer;
  /** The filename of the PDF. */
  filename: string;
};

/**
 * Request parameters for fetching recurring transactions.
 */
export type GetRecurringTransactionsRequest = {
  /** The access token for the user's financial institution. */
  accessToken: string;
  /** The ID of the account to fetch recurring transactions for. */
  accountId: string;
};

/** Response type for fetching recurring transactions. */
export type GetRecurringTransactionsResponse = TransactionsRecurringGetResponse;

/** Alias for the Plaid TransactionStream type. */
export type TransformRecurringTransaction = TransactionStream;
