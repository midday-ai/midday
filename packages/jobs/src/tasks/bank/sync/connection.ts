import { getDb } from "@jobs/init";
import { syncConnectionSchema } from "@jobs/schema";
import { triggerSequenceAndWait } from "@jobs/utils/trigger-sequence";
import {
  getBankAccountsForSync,
  getBankConnectionById,
  updateBankConnectionStatus,
} from "@midday/db/queries";
import { trpc } from "@midday/trpc";
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
    try {
      const data = await getBankConnectionById(getDb(), { id: connectionId });

      if (!data) {
        logger.error("Connection not found");
        throw new Error("Connection not found");
      }

      const connectionResult = await trpc.banking.connectionStatus.query({
        id: data.referenceId ?? undefined,
        provider: data.provider as
          | "gocardless"
          | "plaid"
          | "teller"
          | "enablebanking",
        accessToken: data.accessToken ?? undefined,
      });

      logger.info("Connection response", { connectionResult });

      const connectionData = connectionResult.data;

      if (!connectionData) {
        logger.error("Failed to get connection status");
        throw new Error("Failed to get connection status");
      }

      if (connectionData.status === "connected") {
        await updateBankConnectionStatus(getDb(), {
          id: connectionId,
          teamId: data.teamId,
          status: "connected",
          lastAccessed: new Date().toISOString(),
        });

        // Background sync skips accounts with four or more retries; manual sync can recover them.
        const bankAccountsData = await getBankAccountsForSync(getDb(), {
          connectionId,
          teamId: data.teamId,
          includeErrored: !!manualSync,
        });

        if (!bankAccountsData) {
          logger.info("No bank accounts found");
          return;
        }

        const bankAccounts = bankAccountsData.map((account) => ({
          id: account.id,
          accountId: account.accountId,
          accessToken: account.bankConnection?.accessToken ?? undefined,
          provider: account.bankConnection?.provider,
          connectionId: account.bankConnection?.id,
          teamId: account.teamId,
          accountType: account.type ?? "depository",
          currency: account.currency ?? undefined,
          manualSync,
        }));

        // Only run the sync if there are bank accounts enabled
        // We don't want to delay the sync if it's a manual sync
        // but we do want to delay it if it's an background sync to avoid rate limiting
        if (bankAccounts.length > 0) {
          // @ts-expect-error Existing Trigger utility return type predates SDK v4.
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
          const bankAccountsData = await getBankAccountsForSync(getDb(), {
            connectionId,
            teamId: data.teamId,
            includeErrored: true,
          });

          if (
            bankAccountsData?.every(
              (account) => (account.errorRetries ?? 0) >= 3,
            )
          ) {
            logger.info(
              "All bank accounts have 3+ error retries, disconnecting connection",
            );

            await updateBankConnectionStatus(getDb(), {
              id: connectionId,
              teamId: data.teamId,
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

        await updateBankConnectionStatus(getDb(), {
          id: connectionId,
          teamId: data.teamId,
          status: "disconnected",
        });
      }
    } catch (error) {
      const errorDetails: Record<string, unknown> = {
        connectionId,
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
      };

      if (error instanceof Error && "cause" in error && error.cause) {
        const cause = error.cause as Error;
        errorDetails.cause = cause.message ?? String(cause);
        errorDetails.causeCode = (cause as NodeJS.ErrnoException).code;
      }

      logger.error("Failed to sync connection", errorDetails);

      throw error;
    }
  },
});
