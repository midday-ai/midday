import { openai } from "@ai-sdk/openai";
import type { MessageChangedEvent, WebClient } from "@slack/web-api";
import { generateText } from "ai";
import { startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const defaultValues = {
  from: subMonths(startOfMonth(new Date()), 12).toISOString(),
  to: new Date().toISOString(),
};

export async function messageChanged(
  event: MessageChangedEvent,
  client: WebClient,
) {
  console.log("messageChanged", event);
  // await client.assistant.threads.setStatus({
  //   channel_id: event.channel,
  //   thread_ts: event.thread_ts,
  //   status: "Thinking...",
  // });
  // const { text } = await generateText({
  //   model: openai("gpt-4o-mini"),
  //   system: `\
  //   You are a helpful assistant in Midday who can help users ask questions about their transactions, revenue, spending find invoices and more.
  //   If the user wants the burn rate, call \`getBurnRate\` function.
  //   If the user wants the runway, call \`getRunway\` function.
  //   If the user wants the profit, call \`getProfit\` function.
  //   If the user wants to find transactions or expenses, call \`getTransactions\` function.
  //   If the user wants to see spending based on a category, call \`getSpending\` function.
  //   Always try to call the functions with default values, otherwise ask the user to respond with parameters.
  //   Current date is: ${new Date().toISOString().split("T")[0]} \n
  //   `,
  //   prompt: event.text,
  //   tools: {
  //     getBurnRate: {
  //       description: "Get the burn rate",
  //       parameters: z.object({
  //         currency: z
  //           .string()
  //           .describe("The currency for the burn rate")
  //           .optional(),
  //         startDate: z.coerce
  //           .date()
  //           .describe("The start date of the burn rate, in ISO-8601 format")
  //           .default(new Date(defaultValues.from)),
  //         endDate: z.coerce
  //           .date()
  //           .describe("The end date of the burn rate, in ISO-8601 format")
  //           .default(new Date(defaultValues.to)),
  //       }),
  //       execute: async (args) => {
  //         const { from, to, currency } = args;
  //         return `Burn rate from ${from} to ${to} with currency ${currency}`;
  //       },
  //     },
  //   },
  // });
  // await client.chat.postMessage({
  //   channel: event.channel,
  //   thread_ts: event.thread_ts,
  //   text,
  // });
  // await client.assistant.threads.setStatus({
  //   channel_id: event.channel,
  //   thread_ts: event.thread_ts,
  //   status: "",
  // });
}
