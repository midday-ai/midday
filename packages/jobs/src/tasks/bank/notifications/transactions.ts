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
    const notifications = new Notifications(getDb());

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
        // Create notification - ProviderNotificationService will handle provider-specific
        // notifications (e.g., Slack) based on app settings
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
      }
    } catch (error) {
      await logger.error("Transactions notification", { error });
    }
  },
});
