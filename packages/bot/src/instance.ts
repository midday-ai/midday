import { createSlackAdapter } from "@chat-adapter/slack";
import { createRedisState } from "@chat-adapter/state-redis";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { resolveRedisUrl } from "@midday/cache/shared-redis";
import { Chat } from "chat";
import { createSendblueAdapter } from "chat-adapter-sendblue";

export function createMiddayBot() {
  return new Chat({
    userName: "midday",
    adapters: {
      whatsapp: createWhatsAppAdapter(),
      telegram: createTelegramAdapter(),
      slack: createSlackAdapter(),
      sendblue: createSendblueAdapter(),
    },
    state: createRedisState({ url: resolveRedisUrl() }),
    concurrency: {
      strategy: "debounce",
      debounceMs: 1500,
    },
  });
}

export const bot = createMiddayBot();
