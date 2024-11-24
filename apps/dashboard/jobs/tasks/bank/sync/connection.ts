import { client } from "@midday/engine/client";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { parseAPIError } from "jobs/utils/parse-error";
import { triggerSequence } from "jobs/utils/trigger-sequence";
import { z } from "zod";
import { syncBalance } from "./balance";
import { syncTransactions } from "./transactions";

// Fan-out pattern. We want to trigger a task for each bank connection (Transactions, Balance)
export const syncConnection = schemaTask({
  id: "sync-connection",
  retry: {
    maxAttempts: 2,
  },
  schema: z.object({
    connectionId: z.string().uuid(),
  }),
  run: async ({ connectionId }, { ctx }) => {
    const supabase = createClient();

    try {
      const { data } = await supabase
        .from("bank_connections")
        .select("provider, access_token, reference_id")
        .eq("id", connectionId)
        .single()
        .throwOnError();

      // const connectionResponse = await client.connections.status.$get({
      //   query: {
      //     id: data.reference_id,
      //     provider: data.provider,
      //     access_token: data.access_token,
      //   },
      // });

      // if (!connectionResponse.ok) {
      //   logger.error("Failed to get connection status");
      //   throw new Error("Failed to get connection status");
      // }

      // const { data: connectionData } = await connectionResponse.json();

      // if (connectionData.status === "connected") {
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
        accountId: account.account_id,
        accessToken: account.bank_connection?.access_token ?? undefined,
        provider: account.bank_connection?.provider,
        connectionId: account.bank_connection?.id,
        teamId: account.team_id,
        accountType: account.type ?? "depository",
      }));

      // We run this first to ensure we have a healthy
      // account connection before starting the transaction sync
      await triggerSequence(bankAccounts, syncBalance, {
        tags: ctx.run.tags,
      });

      // TODO: Wait for the account sync to complete before starting the transaction sync
      // We don't want run against the same account at the same time if there are errors
      await triggerSequence(bankAccounts, syncTransactions, {
        tags: ctx.run.tags,
      });
      //   }

      //   if (connectionData.status === "disconnected") {
      //     logger.info("Connection disconnected");

      //     await supabase
      //       .from("bank_connections")
      //       .update({ status: "disconnected" })
      //       .eq("id", connectionId);
    } catch (error) {
      logger.error("Failed to sync connection", {
        error: parseAPIError(error),
      });

      throw error;
    }
  },
});
