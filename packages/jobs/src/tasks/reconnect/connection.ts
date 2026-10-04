import { getDb } from "@jobs/init";
import { reconnectConnectionSchema } from "@jobs/schema";
import { syncConnection } from "@jobs/tasks/bank/sync/connection";
import { matchAndUpdateAccountIds } from "@jobs/utils/account-matching";
import {
  getBankAccountsByConnectionId,
  getBankConnectionById,
  updateBankConnectionReferenceId,
} from "@midday/db/queries";
import { trpc } from "@midday/trpc";
import { logger, schemaTask } from "@trigger.dev/sdk";

export const reconnectConnection = schemaTask({
  id: "reconnect-connection",
  maxDuration: 120,
  retry: {
    maxAttempts: 2,
  },
  schema: reconnectConnectionSchema,
  run: async ({ teamId, connectionId, provider }) => {
    // Fetch existing bank accounts for this connection
    const existingAccounts = (
      await getBankAccountsByConnectionId(getDb(), { connectionId, teamId })
    ).map((account) => ({
      ...account,
      account_reference: account.accountReference,
    }));

    if (!existingAccounts || existingAccounts.length === 0) {
      logger.warn("No existing bank accounts found for connection", {
        connectionId,
        provider,
      });
    }

    if (provider === "gocardless") {
      // We need to update the reference of the connection
      const connectionResponse = await trpc.banking.connectionByReference.query(
        {
          reference: teamId,
        },
      );

      if (!connectionResponse?.data) {
        throw new Error("Connection not found");
      }

      const referenceId = connectionResponse.data.id;

      // Update the reference_id of the new connection
      if (referenceId) {
        logger.info("Updating reference_id for GoCardless connection");
        await updateBankConnectionReferenceId(getDb(), {
          id: connectionId,
          teamId,
          referenceId,
        });
      }

      // Fetch fresh accounts from GoCardless API
      const accountsResponse = await trpc.banking.getProviderAccounts.query({
        id: referenceId,
        provider: "gocardless",
      });

      if (!accountsResponse.data) {
        throw new Error("Accounts not found");
      }

      if (existingAccounts && existingAccounts.length > 0) {
        await matchAndUpdateAccountIds({
          existingAccounts,
          teamId,
          apiAccounts: accountsResponse.data,
          connectionId,
          provider: "gocardless",
        });
      }
    }

    if (provider === "teller") {
      // Get the connection to retrieve access_token and enrollment_id
      const connectionData = await getBankConnectionById(getDb(), {
        id: connectionId,
        teamId,
      });

      if (!connectionData?.accessToken || !connectionData?.enrollmentId) {
        logger.error("Teller connection missing access_token or enrollment_id");
        throw new Error("Teller connection not found");
      }

      // Fetch fresh accounts from Teller API
      const accountsResponse = await trpc.banking.getProviderAccounts.query({
        id: connectionData.enrollmentId,
        provider: "teller",
        accessToken: connectionData.accessToken,
      });

      if (!accountsResponse.data) {
        logger.error("Failed to fetch Teller accounts");
        throw new Error("Teller accounts not found");
      }

      logger.info("Updating Teller account IDs after reconnect", {
        accountCount: accountsResponse.data.length,
      });

      if (existingAccounts && existingAccounts.length > 0) {
        await matchAndUpdateAccountIds({
          existingAccounts,
          teamId,
          apiAccounts: accountsResponse.data,
          connectionId,
          provider: "teller",
        });
      }
    }

    if (provider === "enablebanking") {
      // Get the connection to retrieve reference_id (session_id)
      const connectionData = await getBankConnectionById(getDb(), {
        id: connectionId,
        teamId,
      });

      if (!connectionData?.referenceId) {
        logger.error("EnableBanking connection missing reference_id");
        throw new Error("EnableBanking connection not found");
      }

      // Fetch fresh accounts from EnableBanking API
      const accountsResponse = await trpc.banking.getProviderAccounts.query({
        id: connectionData.referenceId,
        provider: "enablebanking",
      });

      if (!accountsResponse.data) {
        logger.error("Failed to fetch EnableBanking accounts");
        throw new Error("EnableBanking accounts not found");
      }

      logger.info("Updating EnableBanking account IDs after reconnect", {
        accountCount: accountsResponse.data.length,
      });

      if (existingAccounts && existingAccounts.length > 0) {
        await matchAndUpdateAccountIds({
          existingAccounts,
          teamId,
          apiAccounts: accountsResponse.data,
          connectionId,
          provider: "enablebanking",
        });
      }
    }

    if (provider === "plaid") {
      // Plaid uses "update mode" for reconnect which preserves account IDs
      // No account ID remapping is needed, but we log for consistency
      logger.info("Plaid reconnect - account IDs preserved via update mode", {
        connectionId,
      });

      // We still fetch accounts to verify the connection is working
      const connectionData = await getBankConnectionById(getDb(), {
        id: connectionId,
        teamId,
      });

      if (!connectionData?.accessToken) {
        logger.error("Plaid connection missing access_token");
        throw new Error("Plaid connection not found");
      }

      const accountsResponse = await trpc.banking.getProviderAccounts.query({
        provider: "plaid",
        accessToken: connectionData.accessToken,
        institutionId: connectionData.institutionId ?? undefined,
      });

      if (!accountsResponse.data) {
        logger.error("Failed to verify Plaid accounts after reconnect");
        throw new Error("Plaid accounts verification failed");
      }

      logger.info("Plaid accounts verified after reconnect", {
        accountCount: accountsResponse.data.length,
      });
    }

    // Trigger sync to fetch latest transactions
    await syncConnection.trigger({
      connectionId,
      manualSync: true,
    });
  },
});
