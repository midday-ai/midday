import { Database } from "@midday/supabase/types";
import type { TransactionsSchema as EngineTransaction } from "@solomon-ai/financial-engine-sdk/resources/transactions";
import { IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";
import { Events } from "../constants";
import { uniqueLog } from "../utils/log";

/**
 * Sends notifications for new transactions.
 *
 * @param io - The IO object with integrations, including Supabase client.
 * @param transactions - An array of transaction data from the financial engine.
 * @param teamId - The ID of the team associated with these transactions.
 * @param taskKeyPrefix - A prefix for the task key to ensure uniqueness.
 * @returns A promise that resolves to an object indicating whether the operation was successful.
 *
 * @remarks
 * This function performs the following steps:
 * 1. Checks if there are any transactions to process.
 * 2. Logs the number of new transactions being processed.
 * 3. Sends an event notification with transaction details.
 * 4. Returns a success status based on whether transactions were processed.
 *
 * The function uses the `io.runTask` method to execute the notification process,
 * ensuring proper tracking and management of the subtask within the larger workflow.
 *
 * @example
 * ```typescript
 * const result = await sendTransactionsNotificationSubTask(
 *   io,
 *   transactions,
 *   'team-123',
 *   'daily-sync'
 * );
 * console.log(result.success); // true if notifications were sent, false otherwise
 * ```
 */
async function sendTransactionsNotificationSubTask(
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
  transactions: Array<EngineTransaction.Data>,
  teamId: string,
  taskKeyPrefix: string,
): Promise<{ success: boolean }> {
  const supabase = io.supabase.client;

  const response = await io.runTask(
    `${taskKeyPrefix.toLocaleLowerCase()}-sync-transactions-notification-subtask-${Date.now()}`,
    async () => {
      if (transactions.length > 0) {
        await uniqueLog(
          io,
          "info",
          `Sending notifications for ${transactions.length} new transactions`,
        );
        await io.sendEvent("🔔 Send notifications", {
          name: Events.TRANSACTIONS_NOTIFICATION,
          payload: {
            teamId: teamId, // Assuming all accounts belong to the same team
            transactions: transactions.map(
              (transaction: EngineTransaction.Data) => ({
                id: transaction.internal_id,
                date: transaction.date,
                amount: transaction.amount,
                name: transaction.name,
                currency: transaction.currency,
                category: transaction.category_slug,
                status: transaction.status,
              }),
            ),
          },
        });

        return {
          success: true,
        };
      }

      return {
        success: false,
      };
    },
    { name: "Send Transactions Notification Sub Task" },
  );

  return response;
}

export { sendTransactionsNotificationSubTask };
