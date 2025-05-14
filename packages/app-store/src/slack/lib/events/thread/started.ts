import type { AssistantThreadStartedEvent, WebClient } from "@slack/web-api";

export async function assistantThreadStarted(
  event: AssistantThreadStartedEvent,
  client: WebClient,
) {
  try {
    // Post welcome message
    await client.chat.postMessage({
      channel: event.assistant_thread.channel_id,
      thread_ts: event.assistant_thread.thread_ts,
      text: "Welcome! I'm your financial assistant. Here are some suggestions on what you can do:",
    });

    // Set suggested prompts
    await client.assistant.threads.setSuggestedPrompts({
      channel_id: event.assistant_thread.channel_id,
      thread_ts: event.assistant_thread.thread_ts,
      prompts: [
        {
          title: "What's my profit?",
          message: "What's my profit?",
        },
        {
          title: "What did I spend on software last month?",
          message: "How much did I spend on software last month?",
        },
        {
          title: "What's my burn rate?",
          message: "What's my burn rate?",
        },
        {
          title: "What's my runway?",
          message: "What's my runway?",
        },
        {
          title: "What's my revenue?",
          message: "What's my revenue?",
        },
      ],
    });
  } catch (error) {
    console.error("Error handling assistant thread start:", error);
    // Set an error status if something goes wrong
    await client.assistant.threads.setStatus({
      channel_id: event.assistant_thread.channel_id,
      thread_ts: event.assistant_thread.thread_ts,
      status: "Something went wrong",
    });
  }
}
