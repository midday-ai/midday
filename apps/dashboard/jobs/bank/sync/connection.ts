import { client } from "@midday/engine/client";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { triggerSequence } from "jobs/utils/trigger-sequence";
import { z } from "zod";
import { syncBalance } from "./balance";
import { syncTransactions } from "./transactions";

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

    const connectionResponse = await client.connections.status.$get({
      query: {
        id: connectionId,
      },
    });

    if (!connectionResponse.ok) {
      logger.error("Failed to get connection status", { connectionId });
      throw new Error("Failed to get connection status");
    }

    const { data: connectionData } = await connectionResponse.json();

    if (connectionData.status === "connected") {
      await supabase
        .from("bank_connections")
        .update({
          status: "connected",
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", connectionId);

      const { data: bankAccountsData, error: bankAccountsError } =
        await supabase
          .from("bank_accounts")
          .select("id, bank_connection_id")
          .eq("bank_connection_id", connectionId)
          .eq("enabled", true)
          .eq("manual", false);

      if (bankAccountsError) {
        logger.error("Failed to get bank accounts", { connectionId });
        throw new Error("Failed to get bank accounts");
      }

      if (!bankAccountsData) {
        logger.info("No bank accounts found", { connectionId });
        return;
      }

      const bankAccounts = bankAccountsData.map((account) => ({
        accountId: account.id,
      }));

      // We run this first to ensure we have a healthy
      // account connection before starting the transaction sync
      await triggerSequence(
        bankAccounts.map((account) => ({
          accountId: account.id,
          accessToken: account.bank_connection?.access_token,
          provider: account.bank_connection?.provider,
          connectionId: account.bank_connection?.id,
        })),
        syncBalance,
        { tags: ctx.run.tags },
      );

      // TODO: Wait for the account sync to complete before starting the transaction sync
      // We don't want run against the same account at the same time if there are errors
      await triggerSequence(
        bankAccounts.map((account) => ({
          teamId: account.team_id,
          accountId: account.id,
          accountType: account.type ?? "depository",
          accessToken: account.bank_connection?.access_token,
          provider: account.bank_connection?.provider,
        })),
        syncTransactions,
        { tags: ctx.run.tags },
      );
    }

    if (connectionData.status === "disconnected") {
      logger.info("Connection disconnected", { connectionId });

      await supabase
        .from("bank_connections")
        .update({ status: "disconnected" })
        .eq("id", connectionId);
    }
  },
});
