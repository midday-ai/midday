import { closeWorkerDb } from "@midday/db/worker-client";
import { Worker } from "bullmq";
import { Hono } from "hono";
import { getRedisConnection } from "./config";
import { checkHealth } from "./health";
import { getProcessor } from "./processors/registry";
import { queueConfigs } from "./queues";
import { registerStaticSchedulers } from "./schedulers/registry";

// Initialize Redis connection eagerly
// Workers need Redis immediately, so connect at startup to fail fast if unavailable
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

// Health check endpoint (no auth required)
app.get("/health", async (c) => {
  const health = await checkHealth();
  return c.json(health, health.status === "ok" ? 200 : 503);
});

// Start server
const port = Number.parseInt(process.env.PORT || "8080", 10);

Bun.serve({
  port,
  hostname: "0.0.0.0", // Listen on all interfaces
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
