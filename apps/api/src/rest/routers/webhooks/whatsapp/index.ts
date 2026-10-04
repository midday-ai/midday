import { registerMiddayBotRuntime } from "@api/bot/runtime";
import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { bot } from "@midday/bot";

const app = new OpenAPIHono<Context>();

registerMiddayBotRuntime();

app.get("/", async (c) => {
  const webhook = bot.webhooks.whatsapp;
  if (!webhook) {
    return c.json({ error: "Whatsapp integration is not configured" }, 503);
  }
  await bot.initialize();
  return webhook(c.req.raw);
});

app.post("/", async (c) => {
  const webhook = bot.webhooks.whatsapp;
  if (!webhook) {
    return c.json({ error: "Whatsapp integration is not configured" }, 503);
  }
  await bot.initialize();
  return webhook(c.req.raw);
});

export const whatsappWebhookRouter = app;
