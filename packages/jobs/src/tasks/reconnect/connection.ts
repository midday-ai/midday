import { reconnectConnectionSchema } from "@jobs/schema";
import { syncConnection } from "@jobs/tasks/bank/sync/connection";
import { client } from "@midday/engine-client";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";

export const reconnectConnection = schemaTask({
  id: "reconnect-connection",
  maxDuration: 120,
  retry: {
    maxAttempts: 2,
  },
  schema: reconnectConnectionSchema,
  run: async ({ teamId, connectionId, provider }) => {
    const supabase = createClient();

    if (provider === "gocardless") {
      // We need to update the reference of the connection
      const connection = await client.connections[":reference"].$get({
        param: { reference: teamId },
      });

      if (!connection.ok) {
        throw new Error("Connection not found");
      }

      const connectionResponse = await connection.json();

      const referenceId = connectionResponse?.data.id;

      // Update the reference_id of the new connection
      if (referenceId) {
        logger.info("Updating reference_id of the new connection");

        await supabase
          .from("bank_connections")
          .update({
            reference_id: referenceId,
          })
          .eq("id", connectionId);
      }

      // The account_ids can be different between the old and new connection
      // So we need to check for account_reference and update
      const accounts = await client.accounts.$get({
        query: {
          id: referenceId,
          provider: "gocardless",
        },
      });

      if (!accounts.ok) {
        throw new Error("Accounts not found");
      }

      const accountsResponse = await accounts.json();

      // Fetch existing bank accounts for this connection to match by unique ID
      // This prevents the multiple-row update problem when accounts share the same last_four
      const { data: existingAccounts } = await supabase
        .from("bank_accounts")
        .select("id, account_reference, type, currency, name")
        .eq("bank_connection_id", connectionId);

      if (!existingAccounts || existingAccounts.length === 0) {
        logger.warn("No existing bank accounts found for connection", {
          connectionId,
        });
      } else {
        // Track which DB accounts have been matched to prevent double-matching
        const matchedDbIds = new Set<string>();

        await Promise.all(
          accountsResponse.data.map(async (account) => {
            if (!account.resource_id) return;

            // Find the best matching DB account that hasn't been matched yet
            // Priority: resource_id + type + currency + name (most specific)
            // Fallback: resource_id + type + currency
            // Last resort: resource_id only
            const match = existingAccounts.find((dbAccount) => {
              if (matchedDbIds.has(dbAccount.id)) return false;
              if (dbAccount.account_reference !== account.resource_id)
                return false;

              // Try to match on type and currency if available
              const typeMatch =
                !dbAccount.type || dbAccount.type === account.type;
              const currencyMatch =
                !dbAccount.currency || dbAccount.currency === account.currency;

              return typeMatch && currencyMatch;
            });

            if (match) {
              matchedDbIds.add(match.id);
              const result = await supabase
                .from("bank_accounts")
                .update({ account_id: account.id })
                .eq("id", match.id);

              if (result.error) {
                logger.warn("Failed to update GoCardless account", {
                  resource_id: account.resource_id,
                  dbAccountId: match.id,
                  error: result.error.message,
                });
              }
            } else {
              logger.warn(
                "No matching DB account found for GoCardless account",
                {
                  resource_id: account.resource_id,
                  type: account.type,
                  currency: account.currency,
                },
              );
            }
          }),
        );
      }
    }

    if (provider === "teller") {
      // Get the connection to retrieve access_token and enrollment_id
      const { data: connectionData } = await supabase
        .from("bank_connections")
        .select("access_token, enrollment_id")
        .eq("id", connectionId)
        .single();

      if (!connectionData?.access_token || !connectionData?.enrollment_id) {
        logger.error("Teller connection missing access_token or enrollment_id");
        throw new Error("Teller connection not found");
      }

      // Fetch fresh accounts from Teller API
      // Account IDs may change after reconnect, but last_four (resource_id) remains stable
      const accounts = await client.accounts.$get({
        query: {
          id: connectionData.enrollment_id,
          provider: "teller",
          accessToken: connectionData.access_token,
        },
      });

      if (!accounts.ok) {
        logger.error("Failed to fetch Teller accounts");
        throw new Error("Teller accounts not found");
      }

      const accountsResponse = await accounts.json();

      logger.info("Updating Teller account IDs after reconnect", {
        accountCount: accountsResponse.data.length,
      });

      // Fetch existing bank accounts for this connection to match by unique ID
      // This prevents the multiple-row update problem when accounts share the same last_four
      const { data: existingAccounts } = await supabase
        .from("bank_accounts")
        .select("id, account_reference, type, currency, name")
        .eq("bank_connection_id", connectionId);

      if (!existingAccounts || existingAccounts.length === 0) {
        logger.warn("No existing bank accounts found for Teller connection", {
          connectionId,
        });
      } else {
        // Track which DB accounts have been matched to prevent double-matching
        const matchedDbIds = new Set<string>();

        await Promise.all(
          accountsResponse.data.map(async (account) => {
            if (!account.resource_id) return;

            // Find the best matching DB account that hasn't been matched yet
            // Match on: resource_id (last_four) + type + currency
            // If multiple accounts match these criteria, use name as a tiebreaker
            const candidates = existingAccounts.filter((dbAccount) => {
              if (matchedDbIds.has(dbAccount.id)) return false;
              if (dbAccount.account_reference !== account.resource_id)
                return false;
              if (dbAccount.type && dbAccount.type !== account.type)
                return false;
              if (dbAccount.currency && dbAccount.currency !== account.currency)
                return false;
              return true;
            });

            // If multiple candidates, prefer exact name match
            let match = candidates.find(
              (c) => c.name?.toLowerCase() === account.name?.toLowerCase(),
            );
            // Otherwise take the first candidate
            if (!match && candidates.length > 0) {
              match = candidates[0];
            }

            if (match) {
              matchedDbIds.add(match.id);
              const result = await supabase
                .from("bank_accounts")
                .update({ account_id: account.id })
                .eq("id", match.id);

              if (result.error) {
                logger.warn("Failed to update Teller account", {
                  resource_id: account.resource_id,
                  dbAccountId: match.id,
                  error: result.error.message,
                });
              }
            } else {
              logger.warn("No matching DB account found for Teller account", {
                resource_id: account.resource_id,
                type: account.type,
                currency: account.currency,
                name: account.name,
              });
            }
          }),
        );
      }
    }

    await syncConnection.trigger({
      connectionId,
      manualSync: true,
    });
  },
});
