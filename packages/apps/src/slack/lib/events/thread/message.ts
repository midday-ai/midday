import { openai } from "@ai-sdk/openai";
import type { AssistantThreadStartedEvent, WebClient } from "@slack/web-api";
import { generateText } from "ai";
import { startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const defaultValues = {
  from: subMonths(startOfMonth(new Date()), 12).toISOString(),
  to: new Date().toISOString(),
};

export async function assistantThreadMessage(
  event: AssistantThreadStartedEvent,
  client: WebClient,
) {
  // await client.assistant.threads.setStatus({
  //   channel_id: event.channel,
  //   thread_ts: event.thread_ts,
  //   status: "Thinking...",
  // });

  console.log(event);

  await client.assistant.threads.setTitle({
    channel_id: event.channel,
    thread_ts: event.thread_ts,
    title: event.text,
  });

  await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate a 3s wait

  // If no previous message found, post the new message
  await client.chat.postMessage({
    channel: event.channel,
    thread_ts: event.thread_ts,
    text: "Hello",
  });
}
