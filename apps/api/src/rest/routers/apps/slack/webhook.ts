import { registerMiddayBotRuntime } from "@api/bot/runtime";
import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { bot } from "@midday/bot";

const app = new OpenAPIHono<Context>();

registerMiddayBotRuntime();

app.post("/", async (c) => {
  await bot.initialize();
  return bot.webhooks.slack(c.req.raw);
});

export { app as webhookRouter };
