import { openai } from "@ai-sdk/openai";
import { createClient } from "@midday/supabase/server";
import type { AssistantThreadStartedEvent, WebClient } from "@slack/web-api";
import { generateText } from "ai";
import { startOfMonth, subMonths } from "date-fns";
import { getRunwayTool } from "../../tools/get-runway";
import { systemPrompt } from "../../tools/system-prompt";

const defaultValues = {
  from: subMonths(startOfMonth(new Date()), 12).toISOString(),
  to: new Date().toISOString(),
};

export async function assistantThreadMessage(
  event: AssistantThreadStartedEvent,
  client: WebClient,
  { teamId }: { teamId: string },
) {
  const supabase = createClient({ admin: true });

  // Update the status of the thread
  await client.assistant.threads.setStatus({
    channel_id: event.channel,
    thread_ts: event.thread_ts,
    status: "Is thinking...",
  });

  // Set the title of the thread
  await client.assistant.threads.setTitle({
    channel_id: event.channel,
    thread_ts: event.thread_ts,
    title: event.text,
  });

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    maxToolRoundtrips: 5,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: event.text,
      },
    ],
    tools: {
      getRunway: getRunwayTool({
        defaultValues,
        supabase,
        teamId,
      }),
      // getProfit: {
      //   description: "Get the profit",
      //   parameters: z.object({
      //     currency: z
      //       .string()
      //       .describe("The currency for the profit")
      //       .optional(),
      //     startDate: z.coerce
      //       .date()
      //       .describe(
      //         "The start date for profit calculation, in ISO-8601 format",
      //       )
      //       .default(new Date(defaultValues.from)),
      //     endDate: z.coerce
      //       .date()
      //       .describe("The end date for profit calculation, in ISO-8601 format")
      //       .default(new Date(defaultValues.to)),
      //   }),
      //   execute: async ({ currency, startDate, endDate }) => {
      //     return `Profit from ${startDate.toISOString()} to ${endDate.toISOString()} with currency ${currency || "default"}`;
      //   },
      // },
      // getTransactions: {
      //   description: "Get transactions or expenses",
      //   parameters: z.object({
      //     type: z
      //       .enum(["transactions", "expenses"])
      //       .describe("Type of data to retrieve"),
      //     startDate: z.coerce
      //       .date()
      //       .describe("The start date for transactions, in ISO-8601 format")
      //       .default(new Date(defaultValues.from)),
      //     endDate: z.coerce
      //       .date()
      //       .describe("The end date for transactions, in ISO-8601 format")
      //       .default(new Date(defaultValues.to)),
      //   }),
      //   execute: async ({ type, startDate, endDate }) => {
      //     return `${type} from ${startDate.toISOString()} to ${endDate.toISOString()}`;
      //   },
      // },
      // getSpending: {
      //   description: "Get spending based on a category",
      //   parameters: z.object({
      //     category: z.string().describe("The spending category"),
      //     startDate: z.coerce
      //       .date()
      //       .describe(
      //         "The start date for spending calculation, in ISO-8601 format",
      //       )
      //       .default(new Date(defaultValues.from)),
      //     endDate: z.coerce
      //       .date()
      //       .describe(
      //         "The end date for spending calculation, in ISO-8601 format",
      //       )
      //       .default(new Date(defaultValues.to)),
      //   }),
      //   execute: async ({ category, startDate, endDate }) => {
      //     return `Spending for category '${category}' from ${startDate.toISOString()} to ${endDate.toISOString()}`;
      //   },
      // },
    },
  });

  if (text) {
    // Send the message to the thread
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.thread_ts,
      text,
    });
  } else {
    // If no previous message found, post the new message
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.thread_ts,
      text: "Sorry I couldn't find an answer to that question",
    });
  }
}
