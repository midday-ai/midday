import { createSlackWebClient } from "@midday/app-store/slack";
import type { SlackEvent } from "@slack/web-api";
import { waitUntil } from "@vercel/functions";
import { fileShare } from "./file";
import { assistantThreadMessage, assistantThreadStarted } from "./thread";

export async function handleSlackEvent(
  event: SlackEvent,
  options: { token: string; teamId: string },
) {
  const client = createSlackWebClient({
    token: options.token,
  });

  if (event.type === "assistant_thread_started") {
    waitUntil(assistantThreadStarted(event, client));
    return;
  }

  // Check for message events first to enable type-safe access to message-specific properties
  if (event.type === "message") {
    if (event.subtype === "file_share") {
      waitUntil(fileShare(event, options));
      return;
    }

    // Handle general IM messages from users (inspired by reference code)
    // This block targets plain direct messages from users.
    if (
      !event.subtype &&
      event.channel_type === "im" &&
      !event.bot_id && // Ignore messages from bots that have a bot_id
      event.text // Ensure there is text content in the message
    ) {
      waitUntil(assistantThreadMessage(event as any, client, options));
      return;
    }
  }
}
