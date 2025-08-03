import { getDb } from "@jobs/init";
import { syncConnectionSchema } from "@jobs/schema";
import { triggerSequenceAndWait } from "@jobs/utils/trigger-sequence";
import {
  getBankAccountsByConnection,
  getBankConnectionById,
  updateBankConnection,
} from "@midday/db/queries";
import { client } from "@midday/engine-client";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { transactionNotifications } from "../notifications/transactions";
import { syncAccount } from "./account";

// Fan-out pattern. We want to trigger a task for each bank account (Transactions, Balance)
export const syncConnection = schemaTask({
  id: "sync-connection",
  maxDuration: 120,
  retry: {
    maxAttempts: 2,
  },
  schema: syncConnectionSchema,
  run: async ({ connectionId, manualSync }, { ctx }) => {
    const db = getDb();

    try {
      const data = await getBankConnectionById(db, {
        id: connectionId,
      });

      if (!data) {
        logger.error("Connection not found");
        throw new Error("Connection not found");
      }

      const connectionResponse = await client.connections.status.$get({
        query: {
          id: data.referenceId!,
          provider: data.provider as
            | "gocardless"
            | "plaid"
            | "teller"
            | "enablebanking", // Pluggy not supported yet
          accessToken: data.accessToken ?? undefined,
        },
      });

      logger.info("Connection response", { connectionResponse });

      if (!connectionResponse.ok) {
        logger.error("Failed to get connection status");
        throw new Error("Failed to get connection status");
      }

      const { data: connectionData } = await connectionResponse.json();

      if (connectionData.status === "connected") {
        await updateBankConnection(db, {
          id: connectionId,
          status: "connected",
          lastAccessed: new Date().toISOString(),
        });

        const bankAccountsData = await getBankAccountsByConnection(db, {
          connectionId,
          enabled: true,
          manual: false,
          // Skip accounts with more than 3 error retries during background sync
          // Allow all accounts during manual sync to clear errors after reconnect
          maxErrorRetries: manualSync ? undefined : 4,
        });

        if (!bankAccountsData) {
          logger.info("No bank accounts found");
          return;
        }

        const bankAccounts = bankAccountsData.map((account: any) => ({
          id: account.id,
          accountId: account.accountId,
          accessToken: account.bankConnection?.accessToken ?? undefined,
          provider: account.bankConnection?.provider,
          connectionId: account.bankConnection?.id,
          teamId: account.teamId,
          accountType: account.type ?? "depository",
          manualSync,
        }));

        // Only run the sync if there are bank accounts enabled
        // We don't want to delay the sync if it's a manual sync
        // but we do want to delay it if it's an background sync to avoid rate limiting
        if (bankAccounts.length > 0) {
          // @ts-expect-error - TODO: Fix types
          await triggerSequenceAndWait(bankAccounts, syncAccount, {
            tags: ctx.run.tags,
            delaySeconds: manualSync ? 30 : 60, // 30-second delay for manual sync, 60-second for background sync
          });
        }

        logger.info("Synced bank accounts completed");

        // Trigger a notification for new transactions if it's an background sync
        // We delay it by 10 minutes to allow for more transactions to be notified
        if (!manualSync) {
          await transactionNotifications.trigger(
            { teamId: data.teamId },
            { delay: "5m" },
          );
        }

        // Check connection status by accounts
        // If all accounts have 3+ error retries, disconnect the connection
        // So the user will get a notification and can reconnect the bank
        try {
          const bankAccountsData = await getBankAccountsByConnection(db, {
            connectionId,
            manual: false,
            enabled: true,
          });

          if (
            bankAccountsData?.every(
              (account: any) => (account.errorRetries ?? 0) >= 3,
            )
          ) {
            logger.info(
              "All bank accounts have 3+ error retries, disconnecting connection",
            );

            await updateBankConnection(db, {
              id: connectionId,
              status: "disconnected",
            });
          }
        } catch (error) {
          logger.error("Failed to check connection status by accounts", {
            error,
          });
        }
      }

      if (connectionData.status === "disconnected") {
        logger.info("Connection disconnected");

        await updateBankConnection(db, {
          id: connectionId,
          status: "disconnected",
        });
      }
    } catch (error) {
      logger.error("Failed to sync connection", { error });

      throw error;
    }
  },
});
