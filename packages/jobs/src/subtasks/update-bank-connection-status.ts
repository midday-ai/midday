import { ConnectionStatus, Database } from "@midday/supabase/types";
import { IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";
import { BankAccountWithConnection } from "../types/bank-account-with-connection";
import { uniqueLog } from "../utils/log";

/**
 * Updates the status of a bank connection in the database.
 *
 * @param io - The IO object with integrated Supabase client.
 * @param connectionId - The unique identifier of the bank connection to update.
 * @param status - The new status to set for the bank connection.
 * @param taskKeyPrefix - A prefix for the task key used in io.runTask.
 * @param errorDetails - Optional error details to store if the status update is due to an error.
 *
 * @returns A Promise that resolves to an array of BankAccountWithConnection objects if the update is successful, or null if it fails.
 *
 * @throws Will throw an error if the Supabase update operation fails.
 *
 * @example
 * const updatedAccounts = await updateBankConnectionStatus(
 *   io,
 *   "connection-123",
 *   ConnectionStatus.ACTIVE,
 *   "daily-sync",
 *   null
 * );
 */
async function updateBankConnectionStatus(
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
  connectionId: string,
  status: ConnectionStatus,
  taskKeyPrefix: string,
  errorDetails: string | null = null,
): Promise<BankAccountWithConnection[] | null> {
  const supabase = io.supabase.client;

  const data = await io.runTask(
    `${taskKeyPrefix}-update-bank-connection-status-${Date.now()}-${connectionId}`,
    async () => {
      await uniqueLog(io, "info", "Updating bank connection status");
      const { data: accountsData } = await io.supabase.client
        .from("bank_connections")
        .update({
          last_accessed: new Date().toISOString(),
          status: status,
          error_details: errorDetails,
        })
        .eq("id", connectionId);

      return accountsData;
    },
    { name: "Update bank connection status" },
  );

  return data;
}

export { updateBankConnectionStatus };
