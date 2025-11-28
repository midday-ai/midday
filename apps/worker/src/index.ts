import { Worker, type WorkerOptions } from "bullmq";
import { getRedisConnection } from "./config";
import { checkHealth } from "./health";
import { getProcessor } from "./processors/registry";

// Initialize Redis connection
getRedisConnection()
  .connect()
  .catch((err) => {
    console.error("Failed to connect to Redis:", err);
    process.exit(1);
  });

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

// Health check HTTP server
const port = Number.parseInt(process.env.PORT || "8080", 10);

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      const health = await checkHealth();
      return new Response(JSON.stringify(health), {
        headers: { "Content-Type": "application/json" },
        status: health.status === "ok" ? 200 : 503,
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Worker health check server running on port ${port}`);
console.log("Workers initialized and ready to process jobs");
