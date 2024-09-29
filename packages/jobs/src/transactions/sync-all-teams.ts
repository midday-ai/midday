import { intervalTrigger, IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";
import { client, supabase } from "../client";

import { Database } from "@midday/supabase/types";

import { Events, Jobs } from "../constants";
import { engine } from "../utils/engine";
import { uniqueLog } from "../utils/log";
import {
  getClassification,
  Transaction,
  transformTransaction,
} from "../utils/transform";

const RATE_LIMIT_DELAY = 1000; // 1 second delay between processing each team
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

type BankAccountRow = Database["public"]["Tables"]["bank_accounts"]["Row"];
type BankConnectionRow =
  Database["public"]["Tables"]["bank_connections"]["Row"];

type BankAccount = Pick<
  BankAccountRow,
  "id" | "team_id" | "account_id" | "type"
> & {
  bank_connection: Pick<BankConnectionRow, "provider" | "access_token">;
};

/** Represents a team in the system */
interface Team {
  /** Unique identifier for the team */
  id: string;
}

client.defineJob({
  id: Jobs.TRANSACTION_SYNC_ALL_TEAMS,
  name: "Transactions - Sync Transactions For All Teams",
  version: "0.0.1",
  trigger: intervalTrigger({
    seconds: 43200, // run every 12 hours
  }),
  integrations: { supabase },
  /**
   * Main run function for the job. Fetches all teams and processes transactions for each team.
   * @param _ - Unused parameter
   * @param io - I/O context for logging and sending events
   * @param ctx - Job context
   */
  run: async (_, io, ctx) => {
    try {
      const teams = await fetchAllTeams(io);

      for (const team of teams) {
        await processTeamWithRetry(team.id, io);
        await delay(RATE_LIMIT_DELAY);
      }
    } catch (error) {
      await uniqueLog(
        io,
        "error",
        `Error in transaction sync job: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
});

/**
 * Processes a team's transactions with optional retry logic
 * @param teamId - ID of the team to process
 * @param io - I/O context for logging and Supabase integration
 * @param enableRetry - Flag to enable or disable retry logic
 * @param retryCount - Current retry attempt count (used internally for recursion)
 */
async function processTeamWithRetry(
  teamId: string,
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
  enableRetry: boolean = false,
  retryCount: number = 0,
): Promise<void> {
  const processId = nanoid(6);
  try {
    await uniqueLog(
      io,
      "info",
      `Processing team: ${teamId} (Attempt ${retryCount + 1}) [${processId}]`,
    );

    await processTeam(teamId, io);

    await uniqueLog(
      io,
      "info",
      `Successfully processed team: ${teamId} [${processId}]`,
    );
  } catch (error) {
    if (enableRetry && retryCount < MAX_RETRIES) {
      const backoffTime = INITIAL_BACKOFF * Math.pow(2, retryCount);
      await uniqueLog(
        io,
        "warn",
        `Retrying team ${teamId} after ${backoffTime}ms. Retry count: ${retryCount + 1} [${processId}]`,
      );
      await delay(backoffTime);
      await processTeamWithRetry(teamId, io, enableRetry, retryCount + 1);
    } else {
      await uniqueLog(
        io,
        "error",
        `Failed to process team ${teamId}${enableRetry ? ` after ${MAX_RETRIES} retries` : ""}: ${error instanceof Error ? error.message : "Unknown error"} [${processId}]`,
      );
      throw error;
    }
  }
}

/**
 * Fetches all teams from the database
 * @param io - I/O context for logging
 * @returns Promise resolving to an array of Team objects
 */
async function fetchAllTeams(
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
): Promise<Team[]> {
  const supabase = await io.supabase.client;

  const { data: teams, error } = await supabase.from("teams").select("id");

  if (error) {
    await uniqueLog(
      io,
      "error",
      `"Error fetching teams ${JSON.stringify(error)}"`,
    );
    throw error;
  }

  return teams || [];
}

/**
 * Processes transactions for a single team
 * @param teamId - ID of the team to process
 * @param io - I/O context for logging and sending events
 */
async function processTeam(
  teamId: string,
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
): Promise<void> {
  const supabase = await io.supabase.client;

  await uniqueLog(io, "info", `Processing team: ${teamId}`);

  const accounts = await fetchAccounts(teamId, io);
  if (!accounts || accounts.length === 0) {
    await uniqueLog(io, "info", `No accounts found for team: ${teamId}`);
    return;
  }

  const transactions = await processAccounts(accounts, io);
  if (!transactions || transactions.length === 0) {
    await uniqueLog(
      io,
      "info",
      `No new transactions found for team: ${teamId}`,
    );
    return;
  }

  await upsertTransactions(transactions, teamId, io);
  await sendNotifications(transactions, teamId, io);
  revalidateTags(teamId);
}

/**
 * Fetches bank accounts for a specific team
 * @param teamId - ID of the team to fetch accounts for
 * @param io - I/O context for logging
 * @returns Promise resolving to an array of BankAccount objects
 */
async function fetchAccounts(
  teamId: string,
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
): Promise<BankAccount[]> {
  const supabase = await io.supabase.client;

  const { data, error } = await supabase
    .from("bank_accounts")
    .select(
      "id, team_id, account_id, type, bank_connection:bank_connection_id(provider, access_token)",
    )
    .eq("team_id", teamId)
    .eq("enabled", true)
    .eq("manual", false);

  if (error) {
    await uniqueLog(io, "error", `Error fetching accounts for team ${teamId}`);
    throw error;
  }

  return (data as unknown as BankAccount[]) || [];
}

/**
 * Processes accounts to fetch and update balances and transactions
 * @param accounts - Array of BankAccount objects to process
 * @param io - I/O context for logging
 * @returns Promise resolving to an array of processed transactions
 */
async function processAccounts(
  accounts: BankAccount[],
  io: IOWithIntegrations<{
    supabase: Supabase<any, "public", any>;
  }>,
): Promise<any[]> {
  const supabase = await io.supabase.client;

  const promises = accounts.map(async (account) => {
    const provider = account.bank_connection.provider;

    try {
      await updateAccountBalance(account, provider, io);
      return await fetchTransactions(account, provider);
    } catch (error) {
      await uniqueLog(io, "error", `Error processing account ${account.id}`);
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat().map(({ category_slug, ...rest }) => ({
    ...rest,
    category_slug: category_slug,
  }));
}

/**
 * Updates the balance of a bank account
 * @param account - BankAccount object to update
 * @param provider - Provider instance for fetching balance
 * @param io - I/O context for logging
 * @param supabase - Supabase client instance
 */
async function updateAccountBalance(
  account: BankAccount,
  provider: "plaid" | "gocardless" | "teller" | null,
  io: IOWithIntegrations<{
    supabase: Supabase<any, "public", any>;
  }>,
): Promise<void> {
  const supabase = await io.supabase.client;

  try {
    const balance = await engine.accounts.balance({
      id: account.account_id,
      accessToken: account.bank_connection.access_token as string,
      provider: provider as any,
    });

    await supabase
      .from("bank_accounts")
      .update({
        balance: balance?.data?.amount,
        last_accessed: new Date().toISOString(),
      })
      .eq("id", account.id);
  } catch (error) {
    await uniqueLog(
      io,
      "error",
      `Update Account Balance Error. Provider: ${account.bank_connection.provider} Account id: ${account.account_id}`,
    );
  }
}

/**
 * Fetches transactions for a bank account
 * @param account - BankAccount object to fetch transactions for
 * @param provider - Provider instance for fetching transactions
 * @returns Promise resolving to an array of transactions
 */
async function fetchTransactions(
  account: BankAccount,
  provider: "plaid" | "gocardless" | "teller" | null,
): Promise<Array<Transaction>> {
  const result = await engine.transactions.list({
    provider: account.bank_connection.provider as
      | "plaid"
      | "gocardless"
      | "teller",
    accountId: account.account_id,
    accountType: getClassification(
      account.type as
        | "depository"
        | "credit"
        | "other_asset"
        | "loan"
        | "other_liability",
    ),
    accessToken: account.bank_connection?.access_token as string,
    latest: "true",
  });

  const transactions = result.data || [];

  const formattedTransactions = transactions?.map((transaction) => {
    return transformTransaction({
      transaction,
      teamId: account.team_id,
      bankAccountId: account.id,
    });
  });

  return formattedTransactions;
}

/**
 * Upserts transactions into the database
 * @param transactions - Array of transactions to upsert
 * @param teamId - ID of the team the transactions belong to
 * @param io - I/O context for logging
 * @returns Promise resolving to the upserted transactions data
 */
async function upsertTransactions(
  transactions: any[],
  teamId: string,
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
): Promise<any> {
  const supabase = await io.supabase.client;

  const { error, data: transactionsData } = await supabase
    .from("transactions")
    .upsert(transactions, {
      onConflict: "internal_id",
      ignoreDuplicates: true,
    })
    .select("*");

  if (error) {
    await uniqueLog(
      io,
      "error",
      `Error upserting transactions for team ${teamId}`,
    );
    throw error;
  }

  return transactionsData;
}

/**
 * Sends notifications for new transactions
 * @param transactions - Array of transactions to send notifications for
 * @param teamId - ID of the team the transactions belong to
 * @param io - I/O context for sending events
 */
async function sendNotifications(
  transactions: any[],
  teamId: string,
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
): Promise<void> {
  if (transactions && transactions.length > 0) {
    const uniqueId = nanoid(6); // Generate a unique identifier
    await io.sendEvent(`🔔 Send notifications ${uniqueId}`, {
      name: Events.TRANSACTIONS_NOTIFICATION,
      payload: {
        teamId,
        transactions: transactions.map((transaction) => ({
          id: transaction.id,
          date: transaction.date,
          amount: transaction.amount,
          name: transaction.name,
          currency: transaction.currency,
          category: transaction.category_slug,
          status: transaction.status,
        })),
      },
    });
  }
}

/**
 * Revalidates cache tags for a team
 * @param teamId - ID of the team to revalidate tags for
 */
function revalidateTags(teamId: string): void {
  revalidateTag(`transactions_${teamId}`);
  revalidateTag(`spending_${teamId}`);
  revalidateTag(`metrics_${teamId}`);
  revalidateTag(`bank_accounts_${teamId}`);
}

/**
 * Creates a delay for the specified number of milliseconds
 * @param ms - Number of milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
