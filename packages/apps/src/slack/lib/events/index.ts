import { createSlackWebClient } from "@midday/apps/slack";
import type { SlackEvent } from "@slack/bolt";
import { messageChanged } from "./message/changed";
import { assistantThreadMessage, assistantThreadStarted } from "./thread";

export async function handleSlackEvent(
  event: SlackEvent,
  options: { token: string },
) {
  const client = createSlackWebClient({
    token: options.token,
  });

  if (event.type === "assistant_thread_started") {
    return assistantThreadStarted(event, client);
  }

  if (
    event.text &&
    event.type === "message" &&
    event.channel_type === "im" &&
    !event?.bot_id &&
    event.subtype !== "assistant_app_thread"
  ) {
    console.log(event);
    return assistantThreadMessage(event, client);
  }
}
