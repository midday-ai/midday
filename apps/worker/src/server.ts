import { Hono } from "hono";
import { emailQueue } from "./queues";
import { checkQueueHealth } from "./utils/health";

const app = new Hono();

app.get("/health", async (c) => {
  try {
    await checkQueueHealth(emailQueue);
  } catch (error) {
    return c.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }

  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export default {
  port: process.env.PORT || 3000,
  hostname: "::",
  fetch: app.fetch,
};
