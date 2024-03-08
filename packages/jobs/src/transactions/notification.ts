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
      teamId: z.string(),
      transactions: z.array(
        z.object({
          id: z.string(),
          date: z.coerce.date(),
          amount: z.number(),
          name: z.string(),
          currency: z.string(),
        })
      ),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { transactions, teamId } = payload;

    const { data: usersData, error: usersError } = await io.supabase.client
      .from("users_on_team")
      .select(
        "id, team_id, user:users(id, full_name, avatar_url, email, locale)"
      )
      .eq("team_id", teamId);

    if (usersError) {
      await io.logger.error("Users Error", usersError);
    }

    await io.logger.debug("users", usersData);

    const notificationPromises = usersData?.map(async ({ user, team_id }) => {
      const { t } = getI18n({ locale: user.locale });

      return transactions?.map((transaction) => ({
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
        user: {
          subscriberId: user.id,
          teamId: team_id,
          email: user.email,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
        },
      }));
    });

    const notificationEvents = await Promise.all(notificationPromises);

    if (notificationEvents?.length) {
      triggerBulk(notificationEvents.flat());
      await io.logger.log(
        `Sending notifications: ${notificationEvents.length}`
      );
    }

    await io.logger.debug("notificationEvents", notificationEvents);

    const emailPromises = usersData?.map(async ({ user, team_id }) => {
      const { t } = getI18n({ locale: user.locale });

      const html = await renderAsync(
        TransactionsEmail({
          fullName: user.full_name,
          transactions,
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
    });

    const emailEvents = await Promise.all(emailPromises);

    await io.logger.debug("emailEvents", emailEvents);

    if (emailEvents?.length) {
      try {
        triggerBulk(emailEvents.flat());
      } catch (error) {
        await io.logger.debug(error);
      }
    }
  },
});
