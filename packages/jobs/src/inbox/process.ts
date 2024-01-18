import { eventTrigger } from "@trigger.dev/sdk";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { z } from "zod";
import { client, openai, supabase } from "../client";
import { Events, Jobs } from "../constants";

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
    openai,
  },
  run: async (payload, io) => {
    const { data: inboxData } = await io.supabase.client
      .from("inbox")
      .select()
      .eq("id", payload.inboxId)
      .single();

    if (inboxData?.content_type === "application/pdf") {
      const { data } = await io.supabase.client.storage
        .from("vault")
        .download(inboxData.file_path.join("/"));

      const loader = new PDFLoader(data, {
        splitPages: false,
        parsedItemSeparator: "",
      });

      const docs = await loader.load();

      const completion = await io.openai.chat.completions.create("completion", {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "From this invoice extract total amount, due date, issuer name and currency transform currency value to currency code format and return it as JSON if you are unsure of the extracted value return null",
          },
          {
            role: "user",
            content: JSON.stringify(docs.at(0)?.pageContent),
          },
        ],
      });

      const response = completion.choices.at(0)?.message.content;

      if (response) {
        const data = JSON.parse(response);

        const { data: updatedInboxData } = await io.supabase.client
          .from("inbox")
          .update({
            // match any character that is not a digit, comma, or dot, and replaces
            // those characters with an empty string also replace comma with a dot
            amount: data?.totalAmount
              ?.replace(/[^\d.,]/g, "")
              .replace(/,/g, "."),
            currency: data?.currency?.toUpperCase(),
            issuer_name: data?.issuerName,
            due_date: data?.dueDate && new Date(data.dueDate),
          })
          .eq("id", payload.inboxId)
          .select()
          .single();

        await io.sendEvent("Match Inbox", {
          name: Events.MATCH_INBOX,
          payload: {
            teamId: updatedInboxData.team_id,
            inboxId: updatedInboxData.id,
            amount: updatedInboxData.amount,
          },
        });
      }
    }
  },
});
