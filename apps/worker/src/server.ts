import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { getAllQueues } from "@worker/queues";
import { checkQueueHealth } from "@worker/utils/health";
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

// Global variable to track if BullBoard is initialized
let bullBoardInitialized = false;
let serverAdapter: HonoAdapter;

// Function to initialize BullBoard after queues are ready
export function initializeBullBoard() {
  if (bullBoardInitialized) {
    return; // Already initialized
  }

  const queues = getAllQueues();

  if (queues.length === 0) {
    console.warn("No queues found when initializing BullBoard");
    return;
  }

  // Create server adapter
  serverAdapter = new HonoAdapter(serveStatic);

  try {
    // Try the full setup first
    serverAdapter.setBasePath(basePath);
    serverAdapter.setStaticPath("/admin", `${__dirname}/static`);

    createBullBoard({
      queues: queues.map((queue) => new BullMQAdapter(queue)),
      serverAdapter: serverAdapter,
    });

    // Register the BullBoard routes
    app.route(basePath, serverAdapter.registerPlugin());

    bullBoardInitialized = true;
    console.log(
      `BullBoard initialized with ${queues.length} queues:`,
      queues.map((q) => q.name),
    );
  } catch (error) {
    console.error("Error initializing BullBoard:", error);
    console.log("Trying simplified setup...");

    // Fallback to basic setup
    try {
      serverAdapter = new HonoAdapter(serveStatic);
      serverAdapter.setBasePath(basePath);

      createBullBoard({
        queues: queues.map((queue) => new BullMQAdapter(queue)),
        serverAdapter: serverAdapter,
      });

      app.route(basePath, serverAdapter.registerPlugin());
      bullBoardInitialized = true;
      console.log("BullBoard initialized with simplified setup");
    } catch (fallbackError) {
      console.error(
        "Failed to initialize BullBoard even with simplified setup:",
        fallbackError,
      );
    }
  }
}

// Health check endpoint
app.get("/health", async (c) => {
  try {
    await checkQueueHealth();
    return c.json({ status: "ok" }, 200);
  } catch {
    return c.json({ status: "error" }, 500);
  }
});

// Dashboard info endpoint
app.get("/info", (c) => {
  const queues = getAllQueues();
  return c.json({
    queues: queues.map((q) => ({
      name: q.name,
      waiting: q.getWaiting?.length || 0,
    })),
    bullBoardInitialized,
    dashboardUrl: `${basePath}/queues`,
  });
});

export default {
  port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3000,
  hostname: "::",
  fetch: app.fetch,
};
