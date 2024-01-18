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
  id: Jobs.MATCH_INBOX,
  name: "Inbox - Match",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.MATCH_INBOX,
    schema: z.object({
      inboxId: z.string(),
      amount: z.number(),
      teamId: z.string(),
    }),
  }),
  integrations: {
    supabase,
  },
  run: async (payload, io) => {
    // NOTE: All inbox reciepts and invoices amount are
    // saved with positive values while transactions have signed values
    const { data: transactionData } = await io.supabase.client
      .from("decrypted_transactions")
      .select(
        "id, name:decrypted_name, team_id, attachments:transaction_attachments(*)"
      )
      .eq("amount", -Math.abs(payload.amount))
      .eq("team_id", payload.teamId)
      .filter("transaction_attachments.id", "is", null)
      .gte("created_at", subDays(new Date(), 45).toISOString());

    // NOTE: If we match more than one transaction record we can't be sure of a match
    if (transactionData?.length === 1) {
      const transaction = transactionData.at(0);

      const { data: inboxData } = await io.supabase.client
        .from("inbox")
        .select("*")
        .eq("team_id", payload.teamId)
        .eq("id", payload.inboxId)
        .single();

      const { data: attachmentData } = await io.supabase.client
        .from("transaction_attachments")
        .insert({
          type: inboxData.content_type,
          path: inboxData.file_path,
          transaction_id: transaction.id,
          team_id: inboxData.team_id,
          size: inboxData.size,
          name: inboxData.file_name,
        })
        .select()
        .single();

      const { data: updatedInboxData } = await updateInboxById(
        io.supabase.client,
        {
          id: inboxData.id,
          attachment_id: attachmentData.id,
          transaction_id: transaction.id,
          read: true,
        }
      );

      revalidateTag(`transactions_${inboxData.team_id}`);
      revalidateTag(`inbox_${inboxData.team_id}`);

      const { data: usersData, error } = await io.supabase.client
        .from("users_on_team")
        .select(
          "id, role, team_id, locale, user:users(id,full_name,avatar_url,email)"
        )
        .eq("team_id", inboxData.team_id);

      await io.logger.log("usersData", JSON.stringify(usersData, null, 2));
      await io.logger.log("usersData error", JSON.stringify(error, null, 2));

      const notificationEvents = usersData?.map(({ user }) => {
        const { t } = getI18n({ locale: user.locale });

        return {
          name: TriggerEvents.MatchNewInApp,
          payload: {
            recordId: updatedInboxData.transaction_id,
            description: t(
              { id: "notifications.match" },
              {
                transactionName: transaction.name,
                fileName: updatedInboxData.file_name,
              }
            ),
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

      await io.logger.log(
        "notificationEvents",
        JSON.stringify(notificationEvents, null, 2)
      );

      if (notificationEvents?.length) {
        triggerBulk(notificationEvents.flat());
      }
    }
  },
});
