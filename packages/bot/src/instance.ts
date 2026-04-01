import { createSlackAdapter } from "@chat-adapter/slack";
import { createRedisState } from "@chat-adapter/state-redis";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { Chat } from "chat";

export function createMiddayBot() {
  return new Chat({
    userName: "midday",
    adapters: {
      whatsapp: createWhatsAppAdapter(),
      telegram: createTelegramAdapter(),
      slack: createSlackAdapter({
        clientId: process.env.SLACK_CLIENT_ID!,
        clientSecret: process.env.SLACK_CLIENT_SECRET!,
      }),
    },
    state: createRedisState(),
    concurrency: {
      strategy: "debounce",
      debounceMs: 1500,
    },
  });
}

export const bot = createMiddayBot();
