import { registerMiddayBotRuntime } from "@api/bot/runtime";
import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { bot } from "@midday/bot";

const app = new OpenAPIHono<Context>();

registerMiddayBotRuntime();

app.post("/", async (c) => {
  const webhook = bot.webhooks.telegram;
  if (!webhook) {
    return c.json({ error: "Telegram integration is not configured" }, 503);
  }
  await bot.initialize();
  return webhook(c.req.raw);
});

export const telegramWebhookRouter = app;
