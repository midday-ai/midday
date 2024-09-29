import { sendSlackTransactionsNotification } from "@midday/app-store/slack";
import TransactionsEmail from "@midday/email/emails/transactions";
import { getI18n } from "@midday/email/locales";
import { getInboxEmail } from "@midday/inbox";
import {
  NotificationTypes,
  TriggerEvents,
  triggerBulk,
} from "@midday/notification";
import { render } from "@react-email/components";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

client.defineJob({
  id: Jobs.TRANSACTIONS_NOTIFICATION,
  name: "Transactions - Notification",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_NOTIFICATION,
    schema: z.object({
      teamId: z.string(),
      transactions: z.array(
        z.object({
          id: z.string(),
          date: z.coerce.date(),
          amount: z.number(),
          name: z.string(),
          currency: z.string(),
          category: z.string().optional().nullable(),
          status: z.enum(["posted", "pending"]),
        }),
      ),
    }),
  }),
  integrations: { supabase },
  /**
   * Processes transactions and sends notifications to users.
   * 
   * @param payload - The job payload containing team ID and transactions.
   * @param io - The I/O object for interacting with external services.
   * 
   * @remarks
   * This function performs the following steps:
   * 1. Sorts transactions by date (most recent first).
   * 2. Fetches user data for the given team.
   * 3. Generates in-app notification events for each user.
   * 4. Sends in-app notifications.
   * 5. Generates and sends email notifications.
   * 6. Sends Slack notifications.
   */
  run: async (payload, io) => {
    const { transactions, teamId } = payload;

    /**
     * Sorts transactions by date in descending order (most recent first).
     */
    const sortedTransactions = transactions.sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );

    /**
     * Fetches user data for the given team, including related team information.
     */
    const { data: usersData } = await io.supabase.client
      .from("users_on_team")
      .select(
        "id, team_id, team:teams(inbox_id, name), user:users(id, full_name, avatar_url, email, locale)",
      )
      .eq("team_id", teamId);

    /**
     * Generates in-app notification events for each user.
     * 
     * @remarks
     * - For a single transaction, it creates a TransactionNewInApp event.
     * - For multiple transactions, it creates a TransactionsNewInApp event.
     */
    const notificationEvents = usersData?.map(({ user, team_id, team }) => {
      const { t } = getI18n({ locale: user.locale });

      // If single transaction
      if (sortedTransactions.length === 1) {
        const transaction = sortedTransactions?.at(0);

        if (transaction) {
          return {
            name: TriggerEvents.TransactionNewInApp,
            payload: {
              recordId: transaction.id,
              type: NotificationTypes.Transaction,
              description: t("notifications.transaction", {
                amount: Intl.NumberFormat(user.locale, {
                  style: "currency",
                  currency: transaction.currency,
                }).format(transaction.amount),
                from: transaction.name,
              }),
            },
            replyTo: getInboxEmail(team?.inbox_id),
            user: {
              subscriberId: user.id,
              teamId: team_id,
              email: user.email,
              fullName: user.full_name,
              avatarUrl: user.avatar_url,
            },
          };
        }
      }

      // If multiple transactions
      return {
        name: TriggerEvents.TransactionsNewInApp,
        payload: {
          type: NotificationTypes.Transactions,
          from: sortedTransactions.at(0)?.date,
          to: sortedTransactions[sortedTransactions.length - 1]?.date,
          description: t("notifications.transactions", {
            numberOfTransactions: sortedTransactions.length,
          }),
        },
        user: {
          subscriberId: user.id,
          teamId: team_id,
          email: user.email,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
        },
      };
    });

    if (notificationEvents?.length) {
      try {
        await triggerBulk(notificationEvents.flat());
      } catch (error) {
        await io.logger.error("notification events", error);
      }
    }

    /**
     * Generates email notification events for each user.
     * 
     * @remarks
     * Renders a TransactionsEmail component with user-specific data.
     */
    const emailPromises = usersData?.map(async ({ user, team_id, team }) => {
      const { t } = getI18n({ locale: user.locale });

      const html = await render(
        TransactionsEmail({
          fullName: user.full_name,
          transactions: sortedTransactions,
          locale: user.locale,
          teamName: team?.name,
        }),
      );

      return {
        name: TriggerEvents.TransactionNewEmail,
        payload: {
          subject: t("transactions.subject"),
          html,
        },
        replyTo: getInboxEmail(team?.inbox_id),
        user: {
          subscriberId: user.id,
          teamId: team_id,
          email: user.email,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
        },
      };
    });

    const emailEvents = await Promise.all(emailPromises ?? []);

    if (emailEvents.length) {
      try {
        await triggerBulk(emailEvents);
      } catch (error) {
        await io.logger.error("email events", error);
      }
    }

    /**
     * Prepares transaction data for Slack notifications.
     */
    const slackTransactions = sortedTransactions.map((transaction) => ({
      date: transaction.date,
      amount: Intl.NumberFormat("en-US", {
        style: "currency",
        currency: transaction.currency,
      }).format(transaction.amount),
      name: transaction.name,
    }));

    /**
     * Sends Slack notifications with the prepared transaction data.
     */
    await sendSlackTransactionsNotification({
      teamId,
      transactions: slackTransactions,
    });
  },
});
