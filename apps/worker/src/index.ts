// Import Sentry instrumentation first, before any other modules
import "./instrument";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { closeWorkerDb } from "@midday/db/worker-client";
import { Worker } from "bullmq";
import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { serveStatic } from "hono/bun";
import { getRedisConnection } from "./config";
import { getProcessor } from "./processors/registry";
import { getAllQueues, queueConfigs } from "./queues";
import { registerStaticSchedulers } from "./schedulers/registry";

const redisConnection = getRedisConnection();

// Wait for connection to be ready before starting workers
redisConnection.once("ready", () => {
  console.log("[Redis Queue] Connection ready, workers can start processing");
});

/**
 * Create workers dynamically from queue configurations
 */
const workers = queueConfigs.map((config) => {
  const worker = new Worker(
    config.name,
    async (job) => {
      const processor = getProcessor(job.name);
      if (!processor) {
        throw new Error(`No processor registered for job: ${job.name}`);
      }
      return processor.handle(job);
    },
    config.workerOptions,
  );

  // Register event handlers if provided
  if (config.eventHandlers) {
    if (config.eventHandlers.onCompleted) {
      worker.on("completed", (job) => {
        config.eventHandlers!.onCompleted!({
          name: job.name,
          id: job.id,
        });
      });
    }

    if (config.eventHandlers.onFailed) {
      worker.on("failed", (job, err) => {
        config.eventHandlers!.onFailed!(job ?? null, err);
      });
    }
  }

  return worker;
});

// Register static schedulers on startup
registerStaticSchedulers().catch((error) => {
  console.error("Failed to register static schedulers:", error);
  process.exit(1);
});

// Create Hono app
const app = new Hono();

const basePath = "/admin";

// Authentication middleware for BullBoard
if (process.env.BOARD_USERNAME && process.env.BOARD_PASSWORD) {
  app.use(
    basePath,
    basicAuth({
      username: process.env.BOARD_USERNAME,
      password: process.env.BOARD_PASSWORD,
    }),
  );

  app.use(
    `${basePath}/*`,
    basicAuth({
      username: process.env.BOARD_USERNAME,
      password: process.env.BOARD_PASSWORD,
    }),
  );
}

// Initialize BullBoard
function initializeBullBoard() {
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

// Initialize BullBoard on startup
initializeBullBoard();

// Health check endpoint - verifies service is running
app.get("/", (c) => {
  return c.json({ status: "ok" }, 200);
});

// Health check endpoint - verifies service is running
app.get("/health", (c) => {
  return c.json({ status: "ok" }, 200);
});

// Dashboard info endpoint
app.get("/info", (c) => {
  const queues = getAllQueues();
  return c.json({
    queues: queues.map((q) => ({ name: q.name })),
    dashboardUrl: `${basePath}/queues`,
  });
});

// Start server
const port = Number.parseInt(process.env.PORT || "8080", 10);

Bun.serve({
  port,
  hostname: "::",
  fetch: app.fetch,
});

console.log(`Worker server running on port ${port}`);
console.log("Workers initialized and ready to process jobs");

/**
 * Graceful shutdown handlers
 * Close database connections and workers cleanly on process termination
 */
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, starting graceful shutdown...`);

  const SHUTDOWN_TIMEOUT = 30_000; // 30 seconds max for shutdown

  const shutdownPromise = (async () => {
    try {
      // Stop accepting new jobs
      console.log("Stopping workers from accepting new jobs...");
      await Promise.all(workers.map((worker) => worker.close()));

      // Wait a bit for in-flight jobs to complete
      console.log("Waiting for in-flight jobs to complete...");
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds grace period

      // Close database connections
      console.log("Closing database connections...");
      await closeWorkerDb();

      console.log("Graceful shutdown complete");
    } catch (error) {
      console.error("Error during shutdown:", error);
    }
  })();

  // Race shutdown against timeout
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      console.warn("Shutdown timeout reached, forcing exit");
      resolve();
    }, SHUTDOWN_TIMEOUT);
  });

  await Promise.race([shutdownPromise, timeoutPromise]);
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
