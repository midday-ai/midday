import { Hono } from "hono";
import { emailQueue } from "./queues";
import { checkQueueHealth } from "./utils/health";

const app = new Hono();

app.get("/", (c) => c.text("Hello World"));

app.get("/health", async (c) => {
  try {
    await checkQueueHealth(emailQueue);
  } catch (error) {
    return c.json({ status: "ok" }, 200);
  }

  return c.json({ status: "error" }, 500);
});

export default {
  port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3000,
  hostname: "::",
  fetch: app.fetch,
};
