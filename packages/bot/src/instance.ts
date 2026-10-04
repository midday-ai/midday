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
      ...(process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_APP_SECRET &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_VERIFY_TOKEN
        ? { whatsapp: createWhatsAppAdapter() }
        : {}),
      ...(process.env.TELEGRAM_BOT_TOKEN
        ? { telegram: createTelegramAdapter() }
        : {}),
      ...(process.env.SLACK_SIGNING_SECRET
        ? { slack: createSlackAdapter() }
        : {}),
      ...(process.env.SENDBLUE_API_KEY &&
      process.env.SENDBLUE_API_SECRET &&
      process.env.SENDBLUE_FROM_NUMBER
        ? { sendblue: createSendblueAdapter() }
        : {}),
    },
    state: createRedisState({ url: resolveRedisUrl() }),
    concurrency: {
      strategy: "debounce",
      debounceMs: 1500,
    },
  });
}

export const bot = createMiddayBot();
