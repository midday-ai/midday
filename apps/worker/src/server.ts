import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { getAllQueues } from "@worker/queues";
import { getHealthCheck } from "@worker/utils/health";
import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { serveStatic } from "hono/bun";

const app = new Hono();
const basePath = "/admin";

// Authentication middleware
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

// Simple BullBoard initialization
export function initializeBullBoard() {
  const queues = getAllQueues();

  if (queues.length === 0) {
    console.warn("No queues found when initializing BullBoard");
    return;
  }

  const serverAdapter = new HonoAdapter(serveStatic);
  serverAdapter.setBasePath(basePath);

  createBullBoard({
    queues: queues.map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  });

  app.route(basePath, serverAdapter.registerPlugin());

  console.log(
    `BullBoard initialized with ${queues.length} queues:`,
    queues.map((q) => q.name),
  );
}

app.get("/health", async (c) => {
  try {
    const health = await getHealthCheck();
    return c.json(health, 200);
  } catch (error) {
    return c.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Health check failed",
      },
      500,
    );
  }
});

// Dashboard info endpoint
app.get("/info", (c) => {
  const queues = getAllQueues();
  return c.json({
    queues: queues.map((q) => ({ name: q.name })),
    dashboardUrl: `${basePath}/queues`,
  });
});

export default {
  port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3000,
  hostname: "::",
  fetch: app.fetch,
};
