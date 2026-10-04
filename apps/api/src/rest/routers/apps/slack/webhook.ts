import { registerMiddayBotRuntime } from "@api/bot/runtime";
import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { bot } from "@midday/bot";

const app = new OpenAPIHono<Context>();

registerMiddayBotRuntime();

app.post("/", async (c) => {
  const webhook = bot.webhooks.slack;
  if (!webhook) {
    return c.json({ error: "Slack integration is not configured" }, 503);
  }
  await bot.initialize();
  return webhook(c.req.raw);
});

export { app as webhookRouter };
