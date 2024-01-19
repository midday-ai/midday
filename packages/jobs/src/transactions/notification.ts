import TransactionsEmail from "@midday/email/emails/transactions";
import { getI18n } from "@midday/email/locales";
import {
  NotificationTypes,
  TriggerEvents,
  triggerBulk,
} from "@midday/notification";
import { renderAsync } from "@react-email/components";
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
      transactions: z.array(
        z.object({
          id: z.string(),
          date: z.coerce.date(),
          amount: z.number(),
          name: z.string(),
          currency: z.string(),
        })
      ),
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { transactions, teamId } = payload;

    const { data: usersData } = await io.supabase.client
      .from("users_on_team")
      .select("team_id, user:user_id(id, full_name, avatar_url, email, locale)")
      .eq("team_id", teamId);

    const notificationEvents = await Promise.all(
      usersData?.map(async ({ user, team_id }) => {
        const { t } = getI18n({ locale: user.locale });

        return transactions.map((transaction) => ({
          name: TriggerEvents.TransactionNewInApp,
          payload: {
            recordId: transaction.id,
            type: NotificationTypes.Transaction,
            description: t(
              { id: "notifications.transaction" },
              {
                amount: Intl.NumberFormat(user.locale, {
                  style: "currency",
                  currency: transaction.currency,
                }).format(transaction.amount),
                from: transaction.name,
              }
            ),
          },
          user: {
            subscriberId: user.id,
            teamId: team_id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url,
          },
        }));
      })
    );

    if (notificationEvents?.length) {
      triggerBulk(notificationEvents.flat());
      await io.logger.log(
        `Sending notifications: ${notificationEvents.length}`
      );
    }

    const emailEvents = await Promise.all(
      usersData?.map(async ({ user, team_id }) => {
        const { t } = getI18n({ locale: user.locale });

        const html = await renderAsync(
          TransactionsEmail({
            fullName: user.full_name,
            transactions: transactions.map((transaction) => ({
              id: transaction.id,
              date: transaction.date,
              amount: transaction.amount,
              name: transaction.name,
              currency: transaction.currency,
            })),
            locale: user.locale,
          })
        );

        return {
          name: TriggerEvents.TransactionNewEmail,
          payload: {
            subject: t("transactions.subject"),
            html,
          },
          user: {
            subscriberId: user.id,
            teamId: team_id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url,
          },
        };
      })
    );

    if (emailEvents?.length) {
      try {
        triggerBulk(emailEvents);
      } catch (error) {
        await io.logger.error(JSON.stringify(error, null, 2));
      }
    }
  },
});
