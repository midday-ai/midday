import "./instrument";

import { closeWorkerDb, getWorkerDb } from "@midday/db/worker-client";
import { COMPUTE_QUEUE_NAME } from "@midday/job-client";
import { createLoggerWithContext } from "@midday/logger";
import * as Sentry from "@sentry/bun";
import { Worker } from "bullmq";
import { Hono } from "hono";
import { getRedisConnection } from "./config";
import { startScheduler, stopScheduler } from "./scheduler";
import { processJob, processReplay } from "./worker";

const logger = createLoggerWithContext("compute");

const db = getWorkerDb();

const worker = new Worker(
  COMPUTE_QUEUE_NAME,
  async (job) => {
    if (job.name === "replay-proposals") {
      await processReplay(job, db);
    } else {
      await processJob(job, db);
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 5,
  },
);

worker.on("error", (err) => {
  logger.error("Worker error", { error: err.message });
  Sentry.captureException(err, {
    tags: { errorType: "worker_error" },
  });
});

worker.on("failed", (job, err) => {
  logger.error("Job failed", {
    jobId: job?.id,
    jobName: job?.name,
    error: err.message,
  });
  Sentry.captureException(err, {
    tags: { jobName: job?.name ?? "unknown", errorType: "job_failed" },
    extra: { jobId: job?.id, attemptsMade: job?.attemptsMade },
  });
});

worker.on("completed", (job) => {
  logger.info("Job completed", { jobId: job.id, jobName: job.name });
});

startScheduler(db).catch((error) => {
  logger.error("Failed to start scheduler", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

const app = new Hono();

app.get("/", (c) => c.json({ status: "ok" }));
app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number.parseInt(process.env.PORT || "8081", 10);

Bun.serve({
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
});

logger.info(`Compute service running on port ${port}`);

let shuttingDown = false;

const shutdown = async (signal: string) => {
  if (shuttingDown) {
    logger.warn(`Received ${signal} again during shutdown, ignoring`);
    return;
  }
  shuttingDown = true;
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  const SHUTDOWN_TIMEOUT = 30_000;

  const shutdownPromise = (async () => {
    try {
      stopScheduler();

      logger.info("Stopping worker...");
      await worker.close();
      await new Promise((resolve) => setTimeout(resolve, 5000));

      logger.info("Closing database...");
      await closeWorkerDb();

      logger.info("Flushing Sentry events...");
      await Sentry.close(2000);

      logger.info("Graceful shutdown complete");
    } catch (error) {
      logger.error("Error during shutdown", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

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

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack });
  Sentry.captureException(err, {
    tags: { errorType: "uncaught_exception" },
  });
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  Sentry.captureException(
    reason instanceof Error ? reason : new Error(String(reason)),
    { tags: { errorType: "unhandled_rejection" } },
  );
});
