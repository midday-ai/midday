import { syncConnectionSchema } from "@jobs/schema";
import { triggerSequenceAndWait } from "@jobs/utils/trigger-sequence";
import { encrypt } from "@midday/encryption";
import { client } from "@midday/engine-client";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { transactionNotifications } from "../notifications/transactions";
import { syncAccount } from "./account";

// Extended type for API accounts with all new fields
type ApiAccountWithDetails = {
  id: string;
  iban: string | null;
  subtype: string | null;
  bic: string | null;
  routing_number: string | null;
  wire_routing_number: string | null;
  account_number: string | null;
  sort_code: string | null;
};

/**
 * TEMPORARY BACKFILL: Populate static account fields for existing accounts.
 *
 * This function fetches fresh account data from the banking API and updates
 * any existing accounts that are missing the new static fields:
 * - iban, subtype, bic (EU/UK accounts)
 * - routing_number, wire_routing_number, account_number, sort_code (US/UK accounts)
 *
 * Note: available_balance and credit_limit are synced in account.ts alongside
 * the regular balance sync.
 *
 * TODO: Remove this function after 2025-02-01 when most accounts have been updated.
 */
async function backfillAccountStaticFields({
  connectionId,
  provider,
  referenceId,
  accessToken,
}: {
  connectionId: string;
  provider: "gocardless" | "plaid" | "teller" | "enablebanking";
  referenceId: string;
  accessToken?: string;
}) {
  const supabase = createClient();

  // Fetch existing accounts - check all static fields
  const { data: existingAccounts } = await supabase
    .from("bank_accounts")
    .select(
      "id, account_id, iban, subtype, bic, routing_number, wire_routing_number, account_number, sort_code",
    )
    .eq("bank_connection_id", connectionId);

  if (!existingAccounts || existingAccounts.length === 0) {
    return;
  }

  // Check if any accounts need backfill (missing ALL static fields)
  const accountsNeedingBackfill = existingAccounts.filter(
    (account) =>
      account.iban === null &&
      account.subtype === null &&
      account.bic === null &&
      account.routing_number === null &&
      account.account_number === null,
  );

  if (accountsNeedingBackfill.length === 0) {
    logger.debug("No accounts need backfill", { connectionId });
    return;
  }

  logger.info("Backfilling account static fields", {
    connectionId,
    provider,
    accountsToBackfill: accountsNeedingBackfill.length,
  });

  // Fetch fresh accounts from API
  const accounts = await client.accounts.$get({
    query: {
      id: referenceId,
      provider,
      accessToken,
    },
  });

  if (!accounts.ok) {
    logger.warn("Failed to fetch accounts for backfill", { connectionId });
    return;
  }

  const accountsResponse = await accounts.json();

  // Create a map of API account ID to account data
  const apiAccountMap = new Map(
    accountsResponse.data.map((account) => [
      account.id,
      account as ApiAccountWithDetails,
    ]),
  );

  // Update each account that needs backfill
  let updated = 0;
  for (const dbAccount of accountsNeedingBackfill) {
    const apiAccount = apiAccountMap.get(dbAccount.account_id);
    if (!apiAccount) continue;

    // Build update object with available fields
    const updateData: Record<string, string | null> = {};

    // EU/UK fields
    if (apiAccount.iban) {
      updateData.iban = encrypt(apiAccount.iban); // Encrypt IBAN
    }
    if (apiAccount.subtype) {
      updateData.subtype = apiAccount.subtype;
    }
    if (apiAccount.bic) {
      updateData.bic = apiAccount.bic;
    }

    // US fields
    if (apiAccount.routing_number) {
      updateData.routing_number = apiAccount.routing_number;
    }
    if (apiAccount.wire_routing_number) {
      updateData.wire_routing_number = apiAccount.wire_routing_number;
    }
    if (apiAccount.account_number) {
      updateData.account_number = encrypt(apiAccount.account_number); // Encrypt account number
    }

    // UK field
    if (apiAccount.sort_code) {
      updateData.sort_code = apiAccount.sort_code;
    }

    // Only update if we have at least one field
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("bank_accounts")
        .update(updateData)
        .eq("id", dbAccount.id);

      if (!error) {
        updated++;
      }
    }
  }

  if (updated > 0) {
    logger.info("Backfill complete", { connectionId, updated });
  }
}

// Fan-out pattern. We want to trigger a task for each bank account (Transactions, Balance)
export const syncConnection = schemaTask({
  id: "sync-connection",
  maxDuration: 120,
  retry: {
    maxAttempts: 2,
  },
  schema: syncConnectionSchema,
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
          id: data.reference_id!,
          provider: data.provider as
            | "gocardless"
            | "plaid"
            | "teller"
            | "enablebanking", // Pluggy not supported yet
          accessToken: data.access_token ?? undefined,
        },
      });

      logger.info("Connection response", { connectionResponse });

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

        // TEMPORARY BACKFILL: Populate iban, subtype, bic for existing accounts
        // Note: available_balance and credit_limit are synced in syncAccount()
        // TODO: Remove this backfill logic after 2025-02-01
        try {
          await backfillAccountStaticFields({
            connectionId,
            provider: data.provider as
              | "gocardless"
              | "plaid"
              | "teller"
              | "enablebanking",
            referenceId: data.reference_id!,
            accessToken: data.access_token ?? undefined,
          });
        } catch (error) {
          // Log but don't fail the sync - backfill is best effort
          logger.warn("Backfill account static fields failed", { error });
        }

        const query = supabase
          .from("bank_accounts")
          .select(
            "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token, status)",
          )
          .eq("bank_connection_id", connectionId)
          .eq("enabled", true)
          .eq("manual", false);

        // Skip accounts with more than 3 error retries during background sync
        // Allow all accounts during manual sync to clear errors after reconnect
        if (!manualSync) {
          query.or("error_retries.lt.4,error_retries.is.null");
        }

        const { data: bankAccountsData } = await query.throwOnError();

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
            { teamId: data.team_id },
            { delay: "5m" },
          );
        }

        // Check connection status by accounts
        // If all accounts have 3+ error retries, disconnect the connection
        // So the user will get a notification and can reconnect the bank
        try {
          const { data: bankAccountsData } = await supabase
            .from("bank_accounts")
            .select("id, error_retries")
            .eq("bank_connection_id", connectionId)
            .eq("manual", false)
            .eq("enabled", true)
            .throwOnError();

          if (
            bankAccountsData?.every(
              (account) => (account.error_retries ?? 0) >= 3,
            )
          ) {
            logger.info(
              "All bank accounts have 3+ error retries, disconnecting connection",
            );

            await supabase
              .from("bank_connections")
              .update({ status: "disconnected" })
              .eq("id", connectionId);
          }
        } catch (error) {
          logger.error("Failed to check connection status by accounts", {
            error,
          });
        }
      }

      if (connectionData.status === "disconnected") {
        logger.info("Connection disconnected");

        await supabase
          .from("bank_connections")
          .update({ status: "disconnected" })
          .eq("id", connectionId);
      }
    } catch (error) {
      logger.error("Failed to sync connection", { error });

      throw error;
    }
  },
});
