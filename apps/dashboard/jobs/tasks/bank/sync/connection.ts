import { client } from "@midday/engine/client";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { revalidateCache } from "jobs/utils/revalidate-cache";
import { triggerSequenceAndWait } from "jobs/utils/trigger-sequence";
import { z } from "zod";
import { transactionsNotification } from "../notifications/transactions";
import { syncAccount } from "./account";

// Fan-out pattern. We want to trigger a task for each bank account (Transactions, Balance)
export const syncConnection = schemaTask({
  id: "sync-connection",
  retry: {
    maxAttempts: 2,
  },
  schema: z.object({
    connectionId: z.string().uuid(),
    manualSync: z.boolean().optional(),
  }),
  run: async ({ connectionId, manualSync }, { ctx }) => {
    const supabase = createClient();

    try {
      const { data } = await supabase
        .from("bank_connections")
        .select("provider, access_token, reference_id, team_id")
        .eq("id", connectionId)
        .single()
        .throwOnError();

      if (!data) {
        logger.error("Connection not found");
        throw new Error("Connection not found");
      }

      const connectionResponse = await client.connections.status.$get({
        query: {
          id: data.reference_id,
          provider: data.provider,
          access_token: data.access_token,
        },
      });

      if (!connectionResponse.ok) {
        logger.error("Failed to get connection status");
        throw new Error("Failed to get connection status");
      }

      const { data: connectionData } = await connectionResponse.json();

      if (connectionData.status === "connected") {
        await supabase
          .from("bank_connections")
          .update({
            status: "connected",
            last_accessed: new Date().toISOString(),
          })
          .eq("id", connectionId);

        const { data: bankAccountsData } = await supabase
          .from("bank_accounts")
          .select(
            "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token, status, error_retries)",
          )
          .eq("bank_connection_id", connectionId)
          .eq("enabled", true)
          .eq("manual", false)
          .throwOnError();

        if (!bankAccountsData) {
          logger.info("No bank accounts found");
          return;
        }

        const bankAccounts = bankAccountsData.map((account) => ({
          id: account.id,
          accountId: account.account_id,
          accessToken: account.bank_connection?.access_token ?? undefined,
          provider: account.bank_connection?.provider,
          connectionId: account.bank_connection?.id,
          teamId: account.team_id,
          accountType: account.type ?? "depository",
          manualSync,
        }));

        // We don't want to delay the sync if it's a manual sync
        // but we do want to delay it if it's an background sync to avoid rate limiting
        await triggerSequenceAndWait(bankAccounts, syncAccount, {
          tags: ctx.run.tags,
          delayMinutes: manualSync ? 0 : 1,
        });

        logger.info("Synced bank accounts completed");

        // Revalidate the bank cache (transactions, accounts, connections)
        await revalidateCache({ tag: "bank", teamId: data.team_id });

        // Trigger a notification for new transactions if it's an background sync
        // We delay it by 1 minutes to allow for more transactions to be processed
        if (!manualSync) {
          await transactionsNotification.trigger(
            { teamId: data.team_id },
            { delay: "1m" },
          );
        }
      }

      if (connectionData.status === "disconnected") {
        logger.info("Connection disconnected");

        await supabase
          .from("bank_connections")
          .update({ status: "disconnected" })
          .eq("id", connectionId);

        // Revalidate the bank cache (transactions, accounts, connections)
        await revalidateCache({ tag: "bank", teamId: data.team_id });
      }
    } catch (error) {
      logger.error("Failed to sync connection", { error });

      throw error;
    }
  },
});
