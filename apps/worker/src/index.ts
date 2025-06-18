import type { Database } from "@midday/db/client";
import { primaryOnlyDb } from "@midday/db/client";
import { checkPrimaryHealth } from "@midday/db/utils/health";
import { redisConnection } from "@worker/config/redis";
import { logger } from "@worker/monitoring/logger";
import { initializeAllQueues, queues } from "@worker/queues";
import server, { initializeBullBoard } from "@worker/server";
import { createWorkerHandlers } from "@worker/workers";
import { Worker } from "bullmq";

class WorkerService {
  private activeWorkers: Worker[] = [];
  private db: Database | null = null;

  async initialize() {
    try {
      // Initialize database connection using primary-only database
      // This gives us a Database type that's compatible with queries
      // but only uses the primary database for consistency in jobs
      this.db = primaryOnlyDb;

      await checkPrimaryHealth();
      logger.databaseConnected();

      // Initialize all queues
      await initializeAllQueues();

      // Initialize BullBoard now that queues are ready
      initializeBullBoard();

      // Initialize worker handlers with database context
      const workerHandlers = createWorkerHandlers(this.db);

      // Create and configure workers for each job queue
      for (const [queueName, handler] of Object.entries(workerHandlers)) {
        const concurrency = this.getOptimalConcurrency(queueName);

        const worker = new Worker(queueName, handler, {
          connection: redisConnection,
          concurrency,
          // Worker-level job retention (overrides queue defaults)
          removeOnComplete: { count: 10, age: 1 * 3600 }, // Keep fewer completed jobs on worker
          removeOnFail: { count: 25, age: 3 * 24 * 3600 }, // Keep failed jobs longer
        });

        // Set up worker event listeners
        this.configureWorkerEventHandlers(worker, queueName);

        this.activeWorkers.push(worker);
        logger.workerStarted(queueName, concurrency);
      }

      logger.serviceStarted();
    } catch (error) {
      logger.error("Failed to initialize worker service", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  }

  async shutdown() {
    logger.serviceShuttingDown();

    const shutdownPromises = this.activeWorkers.map(async (worker) => {
      const queueName = worker.name;
      await worker.close();
      logger.workerStopped(queueName);
    });

    await Promise.all(shutdownPromises);

    // Close Redis connection gracefully
    if (redisConnection.status === "ready") {
      try {
        await redisConnection.quit();
      } catch (error) {
        logger.warn("Error closing Redis connection", {
          error: error instanceof Error ? error.message : error,
        });
      }
    }

    logger.serviceShutdownComplete();
  }

  private configureWorkerEventHandlers(
    worker: Worker,
    queueName: string,
  ): void {
    // Worker-level error handling
    worker.on("error", (error) => {
      logger.workerError(queueName, error);
    });

    // Job-level event handling
    worker.on("completed", (job, result) => {
      logger.jobCompleted(job);
    });

    worker.on("failed", (job, error) => {
      if (job) {
        logger.jobFailed(job, error);
      }
    });

    worker.on("active", (job) => {
      logger.jobStarted(job);
    });

    worker.on("progress", (job, progress) => {
      if (typeof progress === "number") {
        logger.jobProgress(job, progress);
      }
    });

    // Worker lifecycle events
    worker.on("ready", () => {
      logger.info("Worker ready", { queue: queueName });
    });

    worker.on("closing", () => {
      logger.info("Worker closing", { queue: queueName });
    });
  }

  private getOptimalConcurrency(queueName: string): number {
    // Find concurrency from queue config
    const queueConfig = Object.values(queues).find(
      (config) => config.name === queueName,
    );
    return queueConfig?.concurrency ?? 5;
  }
}

// Initialize and start the Midday worker service
const workerService = new WorkerService();

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  logger.warn("SIGTERM received, shutting down gracefully");
  await workerService.shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.warn("SIGINT received, shutting down gracefully");
  await workerService.shutdown();
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled promise rejection", {
    reason,
    promise,
  });
  process.exit(1);
});

// Initialize and start the service
workerService.initialize().catch((error: Error) => {
  logger.error("Failed to initialize worker service", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

export default server;
