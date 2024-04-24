import { findDocumentValue } from "@midday/inbox";
import {
  NotificationTypes,
  TriggerEvents,
  triggerBulk,
} from "@midday/notification";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

const { DocumentProcessorServiceClient } =
  require("@google-cloud/documentai").v1;

const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS!, "base64").toString(
    "ascii"
  )
);

const DocumentClient = new DocumentProcessorServiceClient({
  apiEndpoint: "eu-documentai.googleapis.com",
  credentials,
});

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

    const contentType = inboxData?.content_type;
    const { data } = await io.supabase.client.storage
      .from("vault")
      .download(inboxData.file_path.join("/"));

    // Convert the document data to a Buffer and base64 encode it.
    const buffer = await data?.arrayBuffer();

    if (!buffer) {
      throw Error("No file data");
    }

    const encodedContent = Buffer.from(buffer).toString("base64");

    try {
      switch (contentType) {
        case "application/pdf":
          {
            const [result] = await DocumentClient.processDocument({
              name: `projects/${credentials.project_id}/locations/eu/processors/${process.env.GOOGLE_APPLICATION_PROCESSOR_ID}`,
              rawDocument: {
                content: encodedContent,
                mimeType: "application/pdf",
              },
            });

            const entities = result.document.entities;
            const currency = findDocumentValue(entities, "currency") ?? null;
            const dueDate = findDocumentValue(entities, "due_date") ?? null;
            const issuerName =
              findDocumentValue(entities, "supplier_name") ?? null;
            const amount = findDocumentValue(entities, "total_amount") ?? null;

            const { data: updatedInboxData } = await io.supabase.client
              .from("inbox")
              .update({
                amount,
                currency,
                name: issuerName,
                due_date: dueDate && new Date(dueDate),
                status: "pending",
                meta: JSON.stringify(entities),
              })
              .eq("id", recordId)
              .select()
              .single();

            if (updatedInboxData?.amount) {
              await io.sendEvent("Match Inbox", {
                name: Events.INBOX_MATCH,
                payload: {
                  teamId: updatedInboxData.team_id,
                  inboxId: updatedInboxData.id,
                  amount: updatedInboxData.amount,
                },
              });

              await io.logger.log("updated inbox", updatedInboxData);
            }
          }
          break;
        case "image/jpeg":
          // TODO: Process expense
          return;
        default:
          return io.logger.debug(
            `Not a supported content type: ${contentType}`
          );
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
              description: `${inbox.name} - ${inbox.subject}`,
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
