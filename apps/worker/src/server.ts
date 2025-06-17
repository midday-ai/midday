import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { serveStatic } from "hono/bun";
import { getAllQueues } from "./queues";
import { checkQueueHealth } from "./utils/health";

const app = new Hono();

const basePath = "/admin";

app.use(
  "/admin",
  basicAuth({
    username: process.env.BULL_BOARD_USERNAME!,
    password: process.env.BULL_BOARD_PASSWORD!,
  }),
);

app.use(
  "/admin/*",
  basicAuth({
    username: process.env.BULL_BOARD_USERNAME!,
    password: process.env.BULL_BOARD_PASSWORD!,
  }),
);

const serverAdapter = new HonoAdapter(serveStatic);
serverAdapter.setBasePath(basePath);

createBullBoard({
  queues: getAllQueues().map((queue) => new BullMQAdapter(queue)),
  serverAdapter: serverAdapter,
});

app.route(basePath, serverAdapter.registerPlugin());

app.get("/health", async (c) => {
  try {
    await checkQueueHealth();
    return c.json({ status: "ok" }, 200);
  } catch {
    return c.json({ status: "error" }, 500);
  }
});

export default {
  port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3000,
  hostname: "::",
  fetch: app.fetch,
};
