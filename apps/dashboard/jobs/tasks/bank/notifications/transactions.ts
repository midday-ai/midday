import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import {
  handleTransactionEmails,
  handleTransactionSlackNotifications,
} from "jobs/utils/transaction-notifications";
import { handleTransactionNotifications } from "jobs/utils/transaction-notifications";
import { z } from "zod";

export const transactionsNotification = schemaTask({
  id: "transactions-notification",
  maxDuration: 300,
  schema: z.object({
    teamId: z.string(),
  }),
  run: async ({ teamId }) => {
    const supabase = createClient();

    try {
      // Mark all transactions as processed and get the ones that need to be notified about
      const { data: transactionsData } = await supabase
        .from("transactions")
        .update({ processed: true })
        .eq("team_id", teamId)
        .eq("processed", false)
        .select("id, date, amount, name, currency, category, status")
        .order("date", { ascending: false })
        .throwOnError();

      const { data: usersData } = await supabase
        .from("users_on_team")
        .select(
          "id, team_id, team:teams(inbox_id, name), user:users(id, full_name, avatar_url, email, locale)",
        )
        .eq("team_id", teamId)
        .eq("role", "owner")
        .throwOnError();

      if (transactionsData && transactionsData.length > 0) {
        await handleTransactionNotifications(usersData, transactionsData);
        await handleTransactionEmails(usersData, transactionsData);
        await handleTransactionSlackNotifications(teamId, transactionsData);
      }
    } catch (error) {
      await logger.error("Transactions notification", { error });

      throw error;
    }
  },
});
