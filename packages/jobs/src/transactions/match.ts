import { getI18n } from "@midday/email/locales";
import {
  NotificationTypes,
  TriggerEvents,
  triggerBulk,
} from "@midday/notification";
import { updateInboxById } from "@midday/supabase/mutations";
import { eventTrigger } from "@trigger.dev/sdk";
import { subDays } from "date-fns";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

client.defineJob({
  id: Jobs.TRANSACTIONS_MATCH,
  name: "Transactions - Match",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_MATCH,
    schema: z.object({
      teamId: z.string(),
      transactionIds: z.array(z.string()),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { transactionIds, teamId } = payload;

    const client = await io.supabase.client;

    const { data } = await client
      .from("transactions")
      .select("id, name, amount")
      .in("id", transactionIds)
      .eq("team_id", teamId);

    const promises = data?.map(async (transaction) => {
      // NOTE: All inbox receipts and invoices amount are
      // saved with positive values while transactions have signed values
      const { data: inboxData } = await client
        .from("inbox")
        .select("*")
        .eq("amount", Math.abs(transaction.amount))
        .gte("created_at", subDays(new Date(), 45).toISOString())
        .is("transaction_id", null);

      if (inboxData && inboxData.length === 1) {
        const inbox = inboxData.at(0);

        const { data: attachmentData } = await client
          .from("transaction_attachments")
          .insert({
            type: inbox.content_type,
            path: inbox.file_path,
            transaction_id: transaction.id,
            team_id: inbox.team_id,
            size: inbox.size,
            name: inbox.file_name,
          })
          .select()
          .single();

        const { data: updatedInboxData } = await updateInboxById(client, {
          id: inbox.id,
          attachment_id: attachmentData.id,
          transaction_id: transaction.id,
          read: true,
        });

        if (!updatedInboxData) {
          return null;
        }

        const { data: usersData } = await client
          .from("users_on_team")
          .select(
            "id, team_id, user:users(id, full_name, avatar_url, email, locale)"
          )
          .eq("team_id", teamId);

        const notificationEvents = usersData?.map(({ user }) => {
          const { t } = getI18n({ locale: user.locale });

          return {
            name: TriggerEvents.MatchNewInApp,
            payload: {
              recordId: updatedInboxData.transaction_id,
              description: t("notifications.match", {
                transactionName: transaction.name,
                fileName: updatedInboxData.file_name,
              }),
              type: NotificationTypes.Match,
            },
            user: {
              subscriberId: user.id,
              teamId: updatedInboxData.team_id,
              email: user.email,
              fullName: user.full_name,
              avatarUrl: user.avatar_url,
            },
          };
        });

        if (notificationEvents) {
          triggerBulk(notificationEvents?.flat());
        }
      }
    });

    if (promises) {
      await Promise.all(promises);
    }

    revalidateTag(`transactions_${teamId}`);
  },
});
