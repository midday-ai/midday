import { registerMiddayBotRuntime } from "@api/bot/runtime";
import { OpenAPIHono } from "@hono/zod-openapi";
import { bot } from "@midday/bot";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

registerMiddayBotRuntime();

app.get("/whatsapp", async (c) => {
  await bot.initialize();
  return bot.webhooks.whatsapp(c.req.raw);
});

app.post("/whatsapp", async (c) => {
  await bot.initialize();
  return bot.webhooks.whatsapp(c.req.raw);
});

app.post("/telegram", async (c) => {
  await bot.initialize();
  return bot.webhooks.telegram(c.req.raw);
});

app.post("/slack", async (c) => {
  await bot.initialize();
  return bot.webhooks.slack(c.req.raw);
});

app.get("/slack/oauth", async (c) => {
  await bot.initialize();
  const slack = bot.getAdapter("slack");
  const { teamId } = await slack.handleOAuthCallback(c.req.raw);

  return c.redirect(
    `${process.env.NEXT_PUBLIC_URL}/settings/apps?connected=slack&teamId=${encodeURIComponent(teamId)}`,
  );
});

export const botRouter = app;
