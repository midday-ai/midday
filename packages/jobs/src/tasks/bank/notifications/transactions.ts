import {
  handleTransactionEmails,
  handleTransactionSlackNotifications,
} from "@jobs/utils/transaction-notifications";
import { handleTransactionNotifications } from "@jobs/utils/transaction-notifications";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const transactionNotifications = schemaTask({
  id: "transaction-notifications",
  maxDuration: 300,
  schema: z.object({
    teamId: z.string(),
  }),
  run: async ({ teamId }) => {
    const supabase = createClient();

    try {
      // Mark all transactions as notified and get the ones that need to be notified about
      const { data: transactionsData } = await supabase
        .from("transactions")
        .update({ notified: true })
        .eq("team_id", teamId)
        .eq("notified", false)
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

      const sortedTransactions = transactionsData?.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      if (sortedTransactions && sortedTransactions.length > 0) {
        // @ts-expect-error - TODO: Fix types
        await handleTransactionNotifications(usersData, sortedTransactions);
        // @ts-expect-error - TODO: Fix types
        await handleTransactionEmails(usersData, sortedTransactions);
        // @ts-expect-error - TODO: Fix types
        await handleTransactionSlackNotifications(teamId, sortedTransactions);
      }
    } catch (error) {
      await logger.error("Transactions notification", { error });

      throw error;
    }
  },
});
