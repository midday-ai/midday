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
  id: Jobs.PROCESS_DOCUMENT,
  name: "Document - Process",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.PROCESS_DOCUMENT,
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
          const currency = findValue(entities, "currency") ?? null;
          const dueDate = findValue(entities, "due_date") ?? null;
          const issuerName = findValue(entities, "supplier_name") ?? null;
          const amount = findValue(entities, "total_amount") ?? null;
          //   invoice_date: findValue(entities, "invoice_date"),
          //   invoice_id: findValue(entities, "invoice_id"),
          //   receiver_email: findValue(entities, "receiver_email"),
          //   total_amount: findValue(entities, "total_amount"),
          //   net_amount: findValue(entities, "net_amount"),
          //   supplier_email: findValue(entities, "supplier_email"),
          //   supplier_address: findValue(entities, "supplier_address"),

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
