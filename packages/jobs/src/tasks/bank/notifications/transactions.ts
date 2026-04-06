import { getDb } from "@jobs/init";
import { Notifications } from "@midday/notifications";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { parseISO } from "date-fns";
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
    const db = getDb();
    const notifications = new Notifications(db);

    try {
      // Update all unnotified transactions for the team as notified and return those transactions
      const { data: transactionsData } = await supabase
        .from("transactions")
        .update({ notified: true })
        .eq("team_id", teamId)
        .eq("notified", false)
        .select("id, date, amount, name, currency, category, status")
        .order("date", { ascending: false })
        .throwOnError();

      const sortedTransactions = transactionsData?.sort((a, b) => {
        return parseISO(b.date).getTime() - parseISO(a.date).getTime();
      });

      if (sortedTransactions && sortedTransactions.length > 0) {
        const transactions = sortedTransactions.map((transaction) => ({
          id: transaction.id,
          date: transaction.date,
          amount: transaction.amount,
          name: transaction.name,
          currency: transaction.currency,
        }));

        // Create notification - ProviderNotificationService will handle provider-specific
        // notifications (e.g., Slack) based on app settings
        await notifications.create(
          "transactions_created",
          teamId,
          {
            transactions,
          },
          {
            sendEmail: true,
          },
        );
        // TODO: migrating to worker
        // await sendToProviders(db, teamId, "transaction", {
        //   transactions,
        // });
      }
    } catch (error) {
      await logger.error("Transactions notification", { error });
    }
  },
});
