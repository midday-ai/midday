import { eventTrigger } from "@trigger.dev/sdk";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { z } from "zod";
import { client, openai, supabase } from "../client";
import { Events, Jobs } from "../constants";

function isOnlyLetters(value: string) {
  return /^[a-zA-Z]+$/.test(value);
}

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
              "You are a invoice parser. From this invoice extract total amount, due date, issuer name, currency and transform currency value to currency code and return it as currency. Return the response in JSON format",
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

        await io.logger.debug("open ai result", data);

        const currency = data?.currency || data?.currency_code;

        const { data: updatedInboxData } = await io.supabase.client
          .from("inbox")
          .update({
            // match any character that is not a digit, comma, or dot, and replaces
            // those characters with an empty string also replace comma with a dot
            amount: data?.total_amount
              .toString()
              ?.replace(/[^\d.,]/g, "")
              .replace(/,/g, "."),
            // NOTE: Guard currency, can only be currency code
            currency: isOnlyLetters(currency) && currency?.toUpperCase(),
            issuer_name: data?.issuer_name,
            due_date: data?.due_date && new Date(data.due_date),
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
    }
  },
});
