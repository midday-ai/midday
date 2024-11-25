import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import {
  handleTransactionEmails,
  handleTransactionSlackNotifications,
} from "jobs/utils/transaction-notifications";
import { handleTransactionNotifications } from "jobs/utils/transaction-notifications";
import { z } from "zod";

export const transactionsNotification = schemaTask({
  id: "transactions-notification",
  schema: z.object({
    teamId: z.string(),
  }),
  run: async ({ teamId }) => {
    const supabase = createClient();

    // Mark all transactions as processed and get the ones that need to be notified about
    const { data: transactionsData } = await supabase
      .from("transactions")
      .update({ processed: true })
      .eq("team_id", teamId)
      .eq("processed", false)
      .select("id, date, amount, name, currency, category, status")
      .throwOnError();

    const { data: usersData } = await supabase
      .from("users_on_team")
      .select(
        "id, team_id, team:teams(inbox_id, name), user:users(id, full_name, avatar_url, email, locale)",
      )
      .eq("team_id", teamId)
      .eq("role", "owner")
      .throwOnError();

    const sortedTransactions = transactionsData?.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    await handleTransactionNotifications(usersData, sortedTransactions);
    await handleTransactionEmails(usersData, sortedTransactions);
    await handleTransactionSlackNotifications(teamId, sortedTransactions);
  },
});
