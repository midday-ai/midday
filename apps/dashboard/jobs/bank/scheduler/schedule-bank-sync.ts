import { createClient } from "@midday/supabase/job";
import { logger, schedules } from "@trigger.dev/sdk/v3";
import { triggerSequence } from "jobs/utils/trigger-sequence";
import { syncBalance } from "../sync/sync-balance";
import { syncTransactions } from "../sync/sync-transactions";

// This is a fan-out pattern. We want to trigger a task for each bank account.
// Each bank account will trigger a task to sync transactions and a task to sync balance.
// We want to trigger these tasks in sequence, but we want to delay each task by a certain amount of time.
// Because of rate limits on our providers, we want to stagger the tasks.
export const scheduleBankSync = schedules.task({
  id: "schedule-bank-sync",
  run: async (payload) => {
    const supabase = createClient();

    const teamId = payload.externalId;

    if (!teamId) {
      throw new Error("externalId is required");
    }

    const { data: bankAccounts, error } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token)",
      )
      .eq("team_id", teamId)
      .eq("enabled", true)
      .eq("manual", false);

    if (error) {
      throw logger.error("Error fetching bank accounts", { error });
    }

    if (!bankAccounts || bankAccounts.length === 0) {
      logger.info("No bank accounts found");
      return;
    }

    await triggerSequence(
      bankAccounts.map((account) => ({
        teamId: account.team_id,
        accountId: account.id,
        accountType: account.type ?? "depository",
        accessToken: account.bank_connection?.access_token,
        provider: account.bank_connection?.provider,
      })),
      syncTransactions,
      {
        tags: ["team_id", teamId],
      },
    );

    await triggerSequence(
      bankAccounts.map((account) => ({
        accountId: account.id,
        accessToken: account.bank_connection?.access_token,
        provider: account.bank_connection?.provider,
        connectionId: account.bank_connection?.id,
      })),
      syncBalance,
      { tags: ["team_id", teamId] },
    );

    // Trigger check connection status
    // If all bank accounts have errors, set the bank connection status to disconnec
  },
});
