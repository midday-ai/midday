// @ts-nocheck
import { openai } from "@ai-sdk/openai";
import { createClient } from "@midday/supabase/server";
import type { AssistantThreadStartedEvent, WebClient } from "@slack/web-api";
import { generateText } from "ai";
import { startOfMonth, subMonths } from "date-fns";
import {
  getBurnRateTool,
  getRunwayTool,
  getSpendingTool,
  systemPrompt,
} from "../../tools";
import { getProfitTool } from "../../tools/get-profit";
import { getRevenueTool } from "../../tools/get-revenue";

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

  const threadHistory = await client.conversations.replies({
    channel: event.channel,
    ts: event.thread_ts,
    limit: 5,
    inclusive: true,
  });

  const lastTwoMessages = threadHistory.messages
    ?.map((msg) => ({
      role: msg.bot_id ? "assistant" : "user",
      content: msg.text || "",
    }))
    .reverse();

  if (!lastTwoMessages || lastTwoMessages.length === 0) {
    console.warn("No messages found in the thread");
  }

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    maxToolRoundtrips: 5,
    system: systemPrompt,
    messages: [
      ...(lastTwoMessages ?? []),
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
      getBurnRate: getBurnRateTool({
        defaultValues,
        supabase,
        teamId,
      }),
      getSpending: getSpendingTool({
        defaultValues,
        supabase,
        teamId,
      }),
      getProfit: getProfitTool({
        defaultValues,
        supabase,
        teamId,
      }),
      getRevenue: getRevenueTool({
        defaultValues,
        supabase,
        teamId,
      }),
    },
  });

  if (text) {
    // Send the message to the thread
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.thread_ts,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: text,
          },
        },
      ],
    });
  } else {
    // If no previous message found, post the new message
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.thread_ts,
      text: "Sorry I couldn't find an answer to that question",
    });

    await client.assistant.threads.setStatus({
      channel_id: event.channel,
      thread_ts: event.thread_ts,
      status: "",
    });
  }
}
