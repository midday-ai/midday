import { getDb } from "@jobs/init";
import { handleTransactionSlackNotifications } from "@jobs/utils/transaction-notifications";
import { Notifications } from "@midday/notifications";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const transactionNotifications = schemaTask({
  id: "transaction-notifications",
  machine: "micro",
  maxDuration: 60,
  schema: z.object({
    teamId: z.string(),
  }),
  run: async ({ teamId }) => {
    const supabase = createClient();
    const notifications = new Notifications(getDb());

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

      const sortedTransactions = transactionsData?.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      if (sortedTransactions && sortedTransactions.length > 0) {
        await notifications.create(
          "transactions_created",
          teamId,
          {
            transactions: sortedTransactions.map((transaction) => ({
              id: transaction.id,
              date: transaction.date,
              amount: transaction.amount,
              name: transaction.name,
              currency: transaction.currency,
            })),
          },
          {
            sendEmail: true,
          },
        );

        // Keep Slack notifications for now (can be migrated later)
        // @ts-expect-error
        await handleTransactionSlackNotifications(teamId, sortedTransactions);
      }
    } catch (error) {
      await logger.error("Transactions notification", { error });

      throw error;
    }
  },
});
