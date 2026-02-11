// Import Sentry instrumentation first, before any other modules
import "./instrument";

import { closeWorkerDb } from "@midday/db/worker-client";
import {
  buildReadinessResponse,
  checkDependencies,
} from "@midday/health/checker";
import { workerDependencies } from "@midday/health/probes";
import { createLoggerWithContext } from "@midday/logger";
import * as Sentry from "@sentry/bun";
import { Worker } from "bullmq";
import { Hono } from "hono";
import { workbench } from "workbench/hono";
import { getProcessor } from "./processors/registry";
import { getAllQueues, queueConfigs } from "./queues";
import { registerStaticSchedulers } from "./schedulers/registry";

const logger = createLoggerWithContext("worker");

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

  // Always attach error handler to prevent unhandled errors
  // See: https://docs.bullmq.io/guide/going-to-production#log-errors
  worker.on("error", (err) => {
    logger.error(`Worker error: ${config.name}`, { error: err.message });
    Sentry.captureException(err, {
      tags: { workerName: config.name, errorType: "worker_error" },
    });
  });

  // Centralized failed handler that captures to Sentry
  // Note: BaseProcessor already captures in-process failures with full context
  // This catches failures that bypass the processor (e.g., no processor registered)
  worker.on("failed", async (job, err) => {
    logger.error(`Job failed: ${job?.name}`, {
      worker: config.name,
      jobId: job?.id,
      error: err.message,
    });
    Sentry.captureException(err, {
      tags: {
        workerName: config.name,
        jobName: job?.name ?? "unknown",
        errorType: "job_failed",
      },
      extra: {
        jobId: job?.id,
        attemptsMade: job?.attemptsMade,
      },
    });

    // Call custom onFailed handler if provided
    // Pass full job info including data for status updates
    if (config.eventHandlers?.onFailed) {
      try {
        await config.eventHandlers.onFailed(
          job
            ? {
                name: job.name,
                id: job.id,
                data: job.data,
                attemptsMade: job.attemptsMade,
                opts: job.opts,
              }
            : null,
          err,
        );
      } catch (handlerError) {
        logger.error(`Error in onFailed handler: ${config.name}`, {
          error:
            handlerError instanceof Error
              ? handlerError.message
              : String(handlerError),
        });
        Sentry.captureException(handlerError, {
          tags: {
            workerName: config.name,
            errorType: "onfailed_handler_error",
          },
        });
      }
    }
  });

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
  }

  return worker;
});

// Register static schedulers on startup
registerStaticSchedulers().catch((error) => {
  logger.error("Failed to register static schedulers", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

// Create Hono app
const app = new Hono();

const basePath = "/admin";

// Initialize Workbench dashboard
function initializeWorkbench() {
  const queues = getAllQueues();

  if (queues.length === 0) {
    logger.warn("No queues found when initializing Workbench");
    return;
  }

  // Mount workbench with optional auth
  app.route(
    basePath,
    workbench({
      queues,
      auth:
        process.env.BOARD_USERNAME && process.env.BOARD_PASSWORD
          ? {
              username: process.env.BOARD_USERNAME,
              password: process.env.BOARD_PASSWORD,
            }
          : undefined,
      title: "Midday Jobs",
      tags: ["teamId"],
    }),
  );

  logger.info(`Workbench initialized with ${queues.length} queues`, {
    queues: queues.map((q) => q.name),
  });
}

// Initialize Workbench on startup
initializeWorkbench();

// Health check endpoint - verifies service is running
app.get("/", (c) => {
  return c.json({ status: "ok" }, 200);
});

// Health check endpoint - verifies service is running
app.get("/health", (c) => {
  return c.json({ status: "ok" }, 200);
});

// Readiness check - verifies core dependencies (DB, Redis queue)
app.get("/health/ready", async (c) => {
  const results = await checkDependencies(workerDependencies(), 1);
  const response = buildReadinessResponse(results);
  return c.json(response, response.status === "ok" ? 200 : 503);
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
  hostname: "0.0.0.0",
  fetch: app.fetch,
});

logger.info(`Worker server running on port ${port}`);
logger.info("Workers initialized and ready to process jobs");

/**
 * Graceful shutdown handlers
 * Close database connections and workers cleanly on process termination
 */
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  const SHUTDOWN_TIMEOUT = 30_000; // 30 seconds max for shutdown

  const shutdownPromise = (async () => {
    try {
      // Stop accepting new jobs
      logger.info("Stopping workers from accepting new jobs...");
      await Promise.all(workers.map((worker) => worker.close()));

      // Wait a bit for in-flight jobs to complete
      logger.info("Waiting for in-flight jobs to complete...");
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds grace period

      // Close database connections
      logger.info("Closing database connections...");
      await closeWorkerDb();

      // Flush pending Sentry events before exit
      logger.info("Flushing Sentry events...");
      await Sentry.close(2000);

      logger.info("Graceful shutdown complete");
    } catch (error) {
      logger.error("Error during shutdown", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  // Race shutdown against timeout
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      logger.warn("Shutdown timeout reached, forcing exit");
      resolve();
    }, SHUTDOWN_TIMEOUT);
  });

  await Promise.race([shutdownPromise, timeoutPromise]);
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

/**
 * Unhandled exception and rejection handlers
 * See: https://docs.bullmq.io/guide/going-to-production#unhandled-exceptions-and-rejections
 */
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack });
  Sentry.captureException(err, {
    tags: { errorType: "uncaught_exception" },
  });
  // Don't exit - let the process manager (Railway) handle restarts
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  Sentry.captureException(
    reason instanceof Error ? reason : new Error(String(reason)),
    {
      tags: { errorType: "unhandled_rejection" },
    },
  );
  // Don't exit - let the process manager (Railway) handle restarts
});
