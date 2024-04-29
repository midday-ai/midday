import { DocumentClient } from "@midday/documents";
import {
  NotificationTypes,
  TriggerEvents,
  triggerBulk,
} from "@midday/notification";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

client.defineJob({
  id: Jobs.INBOX_DOCUMENT,
  name: "Inbox - Document",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.INBOX_DOCUMENT,
    schema: z.object({
      recordId: z.string(),
      teamId: z.string(),
    }),
  }),
  integrations: {
    supabase,
  },
  run: async (payload, io) => {
    const { recordId, teamId } = payload;

    const { data: inboxData } = await io.supabase.client
      .from("inbox")
      .select()
      .eq("id", recordId)
      .single()
      .throwOnError();

    // Get all users on team
    const { data: usersData } = await io.supabase.client
      .from("users_on_team")
      .select("team_id, user:users(id, full_name, avatar_url, email, locale)")
      .eq("team_id", teamId);

    const { data } = await io.supabase.client.storage
      .from("vault")
      .download(inboxData.file_path.join("/"));

    // Convert the document data to a Buffer and base64 encode it.
    const buffer = await data?.arrayBuffer();

    if (!buffer) {
      throw Error("No file data");
    }

    try {
      const document = new DocumentClient({
        contentType: inboxData?.content_type,
      });

      const result = await document.getDocument({
        content: Buffer.from(buffer).toString("base64"),
      });

      const { data: updatedInbox } = await io.supabase.client
        .from("inbox")
        .update({
          amount: result.amount,
          currency: result.currency,
          display_name: result.name,
          website: result.website,
          due_date: result.date && new Date(result.date),
          status: "processing",
          meta: result.meta,
        })
        .eq("id", recordId)
        .select()
        .single();

      if (updatedInbox?.amount) {
        await io.sendEvent("Match Inbox", {
          name: Events.INBOX_MATCH,
          payload: {
            teamId: updatedInbox.team_id,
            inboxId: updatedInbox.id,
            amount: updatedInbox.amount,
          },
        });
      }
    } catch {
      // If we end up here we could not parse the document
      // But we want to update the status so we show the record with fallback name (Subject/From name)
      await io.supabase.client
        .from("inbox")
        .update({ status: "pending" })
        .eq("id", recordId);

      if (!inboxData || !usersData?.length) {
        return;
      }

      // And send a notification about the new inbox record
      const notificationEvents = await Promise.all(
        usersData?.map(async ({ user, team_id }) => {
          return inboxData?.map((inbox) => ({
            name: TriggerEvents.InboxNewInApp,
            payload: {
              recordId: inbox.id,
              description: inbox.display_name,
              type: NotificationTypes.Inbox,
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

      if (notificationEvents.length) {
        triggerBulk(notificationEvents?.flat());
      }
    }
  },
});
