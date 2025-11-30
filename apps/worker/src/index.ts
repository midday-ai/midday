import { Worker, type WorkerOptions } from "bullmq";
import { Hono } from "hono";
import { setupBullBoard } from "./bull-board";
import { getRedisConnection } from "./config";
import { checkHealth } from "./health";
import { getProcessor } from "./processors/registry";

// Initialize Redis connection
// BullMQ will handle connection automatically with lazyConnect: true
// Workers will connect when they start processing jobs
getRedisConnection();

/**
 * Worker options for inbox queue
 * Concurrency: 50 (matching process-attachment)
 */
const inboxWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 50,
  limiter: {
    max: 100,
    duration: 1000, // 100 jobs per second max
  },
};

/**
 * Worker options for inbox provider queue
 * Concurrency: 10
 */
const inboxProviderWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 10,
};

// Create workers with processor registry
const inboxWorker = new Worker(
  "inbox",
  async (job) => {
    const processor = getProcessor(job.name);
    if (!processor) {
      throw new Error(`No processor registered for job: ${job.name}`);
    }
    return processor.handle(job);
  },
  inboxWorkerOptions,
);

const inboxProviderWorker = new Worker(
  "inbox-provider",
  async (job) => {
    const processor = getProcessor(job.name);
    if (!processor) {
      throw new Error(`No processor registered for job: ${job.name}`);
    }
    return processor.handle(job);
  },
  inboxProviderWorkerOptions,
);

/**
 * Worker options for transactions queue
 * Concurrency: 10 (matching export-transactions)
 * Increased stall interval for long-running export jobs
 */
const transactionsWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 10,
  stalledInterval: 5 * 60 * 1000, // 5 minutes - allow jobs to run longer before considering them stalled
  maxStalledCount: 1, // Only retry once if stalled
};

const transactionsWorker = new Worker(
  "transactions",
  async (job) => {
    const processor = getProcessor(job.name);
    if (!processor) {
      throw new Error(`No processor registered for job: ${job.name}`);
    }
    return processor.handle(job);
  },
  transactionsWorkerOptions,
);

// Worker event handlers
inboxWorker.on("completed", (job) => {
  console.log(`Inbox job completed: ${job.name} (${job.id})`);
});

inboxWorker.on("failed", (job, err) => {
  console.error(`Inbox job failed: ${job?.name} (${job?.id})`, err);
});

inboxProviderWorker.on("completed", (job) => {
  console.log(`Inbox provider job completed: ${job.name} (${job.id})`);
});

inboxProviderWorker.on("failed", (job, err) => {
  console.error(`Inbox provider job failed: ${job?.name} (${job?.id})`, err);
});

transactionsWorker.on("failed", (job, err) => {
  console.error(`Transaction job failed: ${job?.name} (${job?.id})`, err);
});

// Basic auth middleware for Bull Board
const basicAuth = () => {
  const username = process.env.BULL_BOARD_USERNAME;
  const password = process.env.BULL_BOARD_PASSWORD;

  if (!username) {
    throw new Error("BULL_BOARD_USERNAME environment variable is required");
  }

  if (!password) {
    throw new Error("BULL_BOARD_PASSWORD environment variable is required");
  }

  return async (c: any, next: () => Promise<void>) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return c.text("Unauthorized", 401, {
        "WWW-Authenticate": 'Basic realm="Bull Board"',
      });
    }

    try {
      const credentials = Buffer.from(authHeader.slice(6), "base64")
        .toString()
        .split(":");
      const [providedUsername, providedPassword] = credentials;

      // Validate both username and password
      if (
        !providedUsername ||
        !providedPassword ||
        providedUsername !== username ||
        providedPassword !== password
      ) {
        return c.text("Unauthorized", 401, {
          "WWW-Authenticate": 'Basic realm="Bull Board"',
        });
      }

      await next();
    } catch (error) {
      return c.text("Unauthorized", 401, {
        "WWW-Authenticate": 'Basic realm="Bull Board"',
      });
    }
  };
};

// Create Hono app
const app = new Hono();

// Health check endpoint (no auth required)
app.get("/health", async (c) => {
  const health = await checkHealth();
  return c.json(health, health.status === "ok" ? 200 : 503);
});

// Bull Board routes (protected by basic auth)
app.use("/admin/queues/*", basicAuth());
setupBullBoard(app);

// Start server
const port = Number.parseInt(process.env.PORT || "8080", 10);

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`Worker server running on port ${port}`);
console.log(`Bull Board available at http://localhost:${port}/admin/queues`);
console.log("Workers initialized and ready to process jobs");
