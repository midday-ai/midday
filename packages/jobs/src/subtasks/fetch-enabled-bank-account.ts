import { Database } from "@midday/supabase/types";
import { IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";
import { BankAccountWithConnection } from "../types/bank-account-with-connection";
import { uniqueLog } from "../utils/log";

/**
 * Fetches enabled bank accounts for a specific team and bank connection.
 *
 * This function is a subtask that queries the Supabase database for bank accounts
 * that are enabled and associated with the given team and bank connection.
 *
 * @param io - An object containing integrations, including a Supabase client.
 * @param teamId - The ID of the team for which to fetch bank accounts.
 * @param connectionId - The ID of the bank connection to filter accounts.
 * @param taskKeyPrefix - A prefix for the task key used in io.runTask.
 *
 * @returns A Promise that resolves to an array of BankAccountWithConnection objects,
 *          or undefined if no accounts are found.
 *
 * @throws Will throw an error if the Supabase query fails.
 *
 * @example
 * ```typescript
 * const accounts = await fetchEnabledBankAccountsSubTask(
 *   io,
 *   "team-123",
 *   "connection-456",
 *   "daily-sync"
 * );
 * ```
 */
async function fetchEnabledBankAccountsSubTask(
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
  teamId: string,
  connectionId: string,
  taskKeyPrefix: string,
): Promise<BankAccountWithConnection[] | null> {
  const supabase = io.supabase.client;

  const data = await io.runTask(
    `${taskKeyPrefix}-fetch-enabled-bank-accounts`,
    async () => {
      // Fetch enabled bank accounts
      await uniqueLog(io, "info", "Fetching enabled bank accounts");
      const { data: accountsData } = await supabase
        .from("bank_accounts")
        .select(
          "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token, last_cursor_sync)",
        )
        .eq("bank_connection_id", connectionId)
        .eq("team_id", teamId)
        .eq("enabled", true)
        .returns<BankAccountWithConnection[]>();

      await uniqueLog(
        io,
        "info",
        `Found ${accountsData?.length || 0} enabled bank accounts`,
      );
      return accountsData;
    },
    { name: "Fetching enabled bank accounts" },
  );

  return data;
}

async function fetchEnabledBankAccountsForTeamSubTask(
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
  teamId: string,
  taskKeyPrefix: string,
  options: { excludeManual?: boolean } = {},
): Promise<BankAccountWithConnection[] | null> {
  const supabase = io.supabase.client;

  const data = await io.runTask(
    `${taskKeyPrefix}-fetch-enabled-bank-accounts`,
    async () => {
      await uniqueLog(io, "info", "Fetching enabled bank accounts");
      let query = supabase
        .from("bank_accounts")
        .select(
          "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token, last_cursor_sync)",
        )
        .eq("team_id", teamId)
        .eq("enabled", true);

      if (options.excludeManual) {
        query = query.eq("manual", false);
      }

      const { data: accountsData, error: accountsError } =
        await query.returns<BankAccountWithConnection[]>();

      if (accountsError) {
        console.error("Error fetching accounts:", accountsError);
        await io.logger.error("Accounts Error", accountsError);

        return null;
      }

      await uniqueLog(
        io,
        "info",
        `Found ${accountsData?.length || 0} enabled bank accounts`,
      );
      return accountsData;
    },
    { name: "Fetching enabled bank accounts" },
  );

  return data;
}

export {
  fetchEnabledBankAccountsForTeamSubTask,
  fetchEnabledBankAccountsSubTask,
};
