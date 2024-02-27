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

const findValue = (entities, type) => {
  const found = entities.find((entry) => entry.type === type);
  return found?.normalizedValue?.text || found?.mentionText;
};

client.defineJob({
  id: Jobs.PROCESS_INBOX,
  name: "Inbox - Process",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.PROCESS_INBOX,
    schema: z.object({
      inboxId: z.string(),
    }),
  }),
  integrations: {
    supabase,
  },
  run: async (payload, io) => {
    const { data: inboxData } = await io.supabase.client
      .from("inbox")
      .select()
      .eq("id", payload.inboxId)
      .single();

    const contentType = inboxData?.content_type;

    switch (contentType) {
      case "application/pdf":
        {
          const { data } = await io.supabase.client.storage
            .from("vault")
            .download(inboxData.file_path.join("/"));

          // Convert the image data to a Buffer and base64 encode it.
          const buffer = await data?.arrayBuffer();
          const encodedContent = Buffer.from(buffer).toString("base64");

          const [result] = await DocumentClient.processDocument({
            name: `projects/${credentials.project_id}/locations/eu/processors/${process.env.GOOGLE_APPLICATION_PROCESSOR_ID}`,
            rawDocument: {
              content: encodedContent,
              mimeType: "application/pdf",
            },
          });

          const entities = result.document.entities;
          const currency = findValue(entities, "currency");
          const dueDate = findValue(entities, "due_date");
          const issuerName = findValue(entities, "supplier_name");
          const amount = findValue(entities, "total_amount");

          const { data: updatedInboxData } = await io.supabase.client
            .from("inbox")
            .update({
              amount,
              currency,
              issuer_name: issuerName,
              due_date: dueDate && new Date(dueDate),
            })
            .eq("id", payload.inboxId)
            .select()
            .single();

          if (updatedInboxData) {
            await io.sendEvent("Match Inbox", {
              name: Events.MATCH_INBOX,
              payload: {
                teamId: updatedInboxData.team_id,
                inboxId: updatedInboxData.id,
                amount: updatedInboxData.amount,
              },
            });

            await io.logger.debug("updated inbox", updatedInboxData);
          }
        }
        break;

      default:
        return io.logger.debug(`Not a supported content type: ${contentType}`);
    }
  },
});
