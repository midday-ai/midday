import { createBaseQueueOptions } from "@worker/queues/base";

// 🎯 OPTIMIZED CONCURRENCY - with improved DB connections + external API limits
const QUEUES = {
  emails: {
    concurrency: 80, // MUCH higher - DB connections no longer bottleneck, fast Resend API
    options: createBaseQueueOptions({
      defaultJobOptions: {
        removeOnComplete: { count: 100, age: 24 * 3600 }, // Keep more email jobs for audit
        attempts: 3,
        priority: 1, // High priority for emails
      },
    }),
  },
  documents: {
    concurrency: 3, // REDUCED - Mistral rate limit: 6 req/sec total across both machines
    options: createBaseQueueOptions({
      defaultJobOptions: {
        removeOnComplete: { count: 30, age: 24 * 3600 }, // Keep fewer document jobs
        attempts: 3, // Increased from 2 to match other jobs, AI timeouts need more retries
        backoff: { type: "exponential", delay: 20000 }, // Longer delay due to rate limits
      },
    }),
  },
  invoices: {
    concurrency: 25, // Higher - PDF generation + DB no longer bottleneck
    options: createBaseQueueOptions({
      defaultJobOptions: {
        removeOnComplete: { count: 50, age: 24 * 3600 }, // Keep invoice jobs for audit
        attempts: 3,
        priority: 2, // Medium priority for invoices
        backoff: { type: "exponential", delay: 3000 }, // Slightly longer delay
      },
    }),
  },
  exports: {
    concurrency: 6, // Higher - memory is main constraint, not DB connections
    options: createBaseQueueOptions({
      defaultJobOptions: {
        removeOnComplete: { count: 20, age: 7 * 24 * 3600 }, // Keep export jobs for 7 days for audit
        attempts: 3,
        priority: 3, // Lower priority since exports are not time-critical
        backoff: { type: "exponential", delay: 8000 }, // Longer delay for large exports
      },
    }),
  },
  imports: {
    concurrency: 3, // Lower concurrency for imports to manage memory and DB load
    options: createBaseQueueOptions({
      defaultJobOptions: {
        removeOnComplete: { count: 50, age: 7 * 24 * 3600 }, // Keep import jobs for 7 days for audit
        attempts: 3,
        priority: 2, // Medium priority for imports
        backoff: { type: "exponential", delay: 5000 }, // Longer delay for large imports
      },
    }),
  },
  teams: {
    concurrency: 40, // MUCH higher - just DB calls and API calls, no external limits
    options: createBaseQueueOptions({
      defaultJobOptions: {
        removeOnComplete: { count: 50, age: 7 * 24 * 3600 }, // Keep team jobs for 7 days for audit
        attempts: 3,
        priority: 2, // Medium priority for team operations
        backoff: { type: "exponential", delay: 5000 }, // Longer delay for external API calls
      },
    }),
  },
  system: {
    concurrency: 8, // Higher - just database operations and exchange rate APIs
    options: createBaseQueueOptions({
      defaultJobOptions: {
        removeOnComplete: { count: 20, age: 7 * 24 * 3600 }, // Keep system jobs for 7 days for audit
        attempts: 3,
        priority: 4, // Lower priority for system operations
        backoff: { type: "exponential", delay: 10000 }, // Longer delay for external API calls
      },
    }),
  },
} as const;

// Simple helper to create job queue config
function createJobQueue(name: keyof typeof QUEUES) {
  const config = QUEUES[name];
  const jobOptions = config.options.defaultJobOptions;
  return {
    name,
    concurrencyLimit: config.concurrency,
    priority: jobOptions?.priority ?? 1,
    removeOnComplete: (jobOptions?.removeOnComplete as any)?.count ?? 50,
    removeOnFail: (jobOptions?.removeOnFail as any)?.count ?? 50,
    attempts: jobOptions?.attempts ?? 3,
  };
}

// Direct exports - no complex transformations
export const emailQueue = createJobQueue("emails");
export const documentsQueue = createJobQueue("documents");
export const invoicesQueue = createJobQueue("invoices");
export const exportsQueue = createJobQueue("exports");
export const importsQueue = createJobQueue("imports");
export const teamsQueue = createJobQueue("teams");
export const systemQueue = createJobQueue("system");

// Simple worker queue configs - just add name to each config
export const queues = {
  emails: { name: "emails", ...QUEUES.emails },
  documents: { name: "documents", ...QUEUES.documents },
  invoices: { name: "invoices", ...QUEUES.invoices },
  exports: { name: "exports", ...QUEUES.exports },
  imports: { name: "imports", ...QUEUES.imports },
  teams: { name: "teams", ...QUEUES.teams },
  system: { name: "system", ...QUEUES.system },
} as const;
