import type { AssistantThreadStartedEvent, WebClient } from "@slack/web-api";

export async function assistantThreadStarted(
  event: AssistantThreadStartedEvent,
  client: WebClient,
) {
  try {
    // Set initial status while preparing prompts
    await client.assistant.threads.setStatus({
      channel_id: event.assistant_thread.channel_id,
      thread_ts: event.assistant_thread.thread_ts,
      status: "Thinking...",
    });

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
          title: "Recent Transactions",
          message: "Show me my recent transactions",
        },
        {
          title: "Category Spending",
          message: "How much did I spend on software last month?",
        },
        {
          title: "Burn Rate",
          message: "What's my current burn rate?",
        },
        {
          title: "Runway",
          message: "What's my runway?",
        },
      ],
    });

    // Clear the "Thinking..." status
    await client.assistant.threads.setStatus({
      channel_id: event.assistant_thread.channel_id,
      thread_ts: event.assistant_thread.thread_ts,
      status: "",
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
