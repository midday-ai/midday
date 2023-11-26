import { client } from "@/trigger";
import TransactionsEmail from "@midday/email/emails/transactions";
import { getI18n } from "@midday/email/locales";
import { TriggerEvents, triggerBulk } from "@midday/notification";
import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { supabase } from "../client";

client.defineJob({
  id: "transactions-notification",
  name: "🔔 Transactions - Notification",
  version: "1.0.1",
  trigger: eventTrigger({
    name: "transactions.notification",
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

    await io.logger.info(`usersData: ${JSON.stringify(usersData, null, 2)}`);

    if (transactions?.length && transactions.length > 0) {
      revalidateTag(`transactions_${teamId}`);
      revalidateTag(`spending_${teamId}`);
      revalidateTag(`metrics_${teamId}`);

      await io.logger.info(
        `transactions: ${JSON.stringify(transactions, null, 2)}`
      );

      const notificationEvents = await Promise.all(
        usersData?.map(async ({ user, team_id }) => {
          const { t } = getI18n({ locale: user.locale });

          return transactions.map((transaction) => ({
            name: TriggerEvents.TransactionNewInApp,
            payload: {
              transactionId: transaction.id,
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

      await io.logger.info(
        `notificationEvents: ${JSON.stringify(notificationEvents, null, 2)}`
      );

      if (notificationEvents?.length) {
        triggerBulk(notificationEvents.flat());
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
              subject: t({ id: "transactions.subject" }),
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

      await io.logger.info(
        `emailEvents: ${JSON.stringify(emailEvents, null, 2)}`
      );

      if (emailEvents?.length) {
        triggerBulk(emailEvents);
      }
    }
  },
});
