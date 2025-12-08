import { createLoggerWithContext } from "@midday/logger";
import { getQueue } from "./queues";
import type { JobStatus, JobStatusResponse, JobTriggerResponse } from "./types";

// Re-export getQueue for use in API routes that need direct queue access
export { getQueue } from "./queues";

// Create logger with job-client context
export const logger = createLoggerWithContext("job-client");

/**
 * Trigger a job in the specified queue
 * @param jobName - Name of the job (e.g., "export-transactions")
 * @param payload - Job payload data
 * @param queueName - Name of the queue (e.g., "transactions", "inbox", "inbox-provider")
 * @returns Job information including the job ID
 */
export async function triggerJob(
  jobName: string,
  payload: unknown,
  queueName: string,
): Promise<JobTriggerResponse> {
  const queue = getQueue(queueName);
  const enqueueStartTime = Date.now();

  try {
    const job = await queue.add(jobName, payload);

    if (!job?.id) {
      throw new Error(
        `Failed to create job: ${jobName} in queue: ${queueName}`,
      );
    }

    const enqueueDuration = Date.now() - enqueueStartTime;
    logger.info("Enqueued job", {
      jobName,
      jobId: job.id,
      queueName,
      duration: `${enqueueDuration}ms`,
    });

    return {
      id: job.id,
    };
  } catch (error) {
    const enqueueDuration = Date.now() - enqueueStartTime;
    logger.error("Error triggering job", {
      jobName,
      queueName,
      duration: `${enqueueDuration}ms`,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Trigger a child job that waits for a parent job to complete
 *
 * This function creates a parent-child relationship using BullMQ's built-in pattern.
 * The child job will automatically wait in "waiting-children" state until the parent
 * completes successfully, then it becomes available for processing.
 *
 * Use this when you need to ensure a job runs only after another job completes,
 * without blocking the current execution context.
 *
 * @param jobName - Name of the child job (e.g., "batch-process-matching")
 * @param payload - Job payload data
 * @param queueName - Name of the queue where the child job will be added
 * @param parentJobId - ID of the parent job that must complete first
 * @param parentQueueName - Queue name where the parent job exists (defaults to queueName)
 * @returns Job information including the child job ID
 *
 * @example
 * ```typescript
 * // First, trigger the parent job
 * const parentJob = await triggerJob("embed-inbox", { inboxId, teamId }, "inbox");
 *
 * // Then, trigger the child job that waits for the parent
 * const childJob = await triggerChildJob(
 *   "batch-process-matching",
 *   { teamId, inboxIds: [inboxId] },
 *   "inbox",
 *   parentJob.id,
 *   "inbox"
 * );
 * ```
 */
export async function triggerChildJob(
  jobName: string,
  payload: unknown,
  queueName: string,
  parentJobId: string,
  parentQueueName?: string,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
  },
): Promise<JobTriggerResponse> {
  const queue = getQueue(queueName);
  const enqueueStartTime = Date.now();
  const maxRetries = options?.maxRetries ?? 3;
  const retryDelay = options?.retryDelay ?? 1000;

  let lastError: Error | null = null;

  // Retry logic for child job enqueue failures
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // BullMQ parent-child pattern: child job waits for parent to complete
      // The child will wait in "waiting-children" state until parent completes successfully
      // Format: parent.queue should be the queue name string (not queueQualifiedName)
      const jobOptions: Parameters<typeof queue.add>[2] = {
        parent: {
          id: parentJobId,
          queue: parentQueueName ?? queueName,
        },
        attempts: 1, // Child jobs inherit parent's retry behavior
      };

      const job = await queue.add(jobName, payload, jobOptions);

      if (!job?.id) {
        throw new Error(
          `Failed to create child job: ${jobName} in queue: ${queueName}`,
        );
      }

      const enqueueDuration = Date.now() - enqueueStartTime;
      logger.info("Enqueued child job", {
        jobName,
        jobId: job.id,
        queueName,
        parentJobId,
        parentQueueName: parentQueueName ?? queueName,
        attempt,
        duration: `${enqueueDuration}ms`,
      });

      return {
        id: job.id,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const enqueueDuration = Date.now() - enqueueStartTime;

      if (attempt < maxRetries) {
        const delay = retryDelay * attempt; // Exponential backoff
        logger.warn("Failed to enqueue child job, retrying", {
          jobName,
          queueName,
          parentJobId,
          attempt,
          maxRetries,
          delay,
          error: lastError.message,
        });

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error("Error triggering child job after retries", {
          jobName,
          queueName,
          parentJobId,
          parentQueueName: parentQueueName ?? queueName,
          attempts: maxRetries,
          duration: `${enqueueDuration}ms`,
          error: lastError.message,
          stack: lastError.stack,
        });
      }
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error("Failed to enqueue child job after retries");
}

/**
 * Known queue names in the worker system
 * Must match the queues defined in apps/worker/src/queues/index.ts
 */
const KNOWN_QUEUES = [
  "transactions",
  "inbox",
  "inbox-provider",
  "documents",
  "notifications",
  "rates",
];

/**
 * Get job status by ID
 * Tries all known queues if queueName is not provided
 */
export async function getJobStatus(
  jobId: string,
  queueName?: string,
): Promise<JobStatusResponse> {
  const queueNames = queueName ? [queueName] : KNOWN_QUEUES;

  for (const name of queueNames) {
    const queue = getQueue(name);

    try {
      const job = await queue.getJob(jobId);

      if (job) {
        const state = await job.getState();
        const progress = job.progress;
        const returnValue = job.returnvalue;
        const failedReason = job.failedReason;

        // Map BullMQ states to our status enum
        let status: JobStatus;
        switch (state) {
          case "waiting":
            status = "waiting";
            break;
          case "active":
            status = "active";
            break;
          case "completed":
            status = "completed";
            break;
          case "failed":
            status = "failed";
            break;
          case "delayed":
            status = "delayed";
            break;
          default:
            status = "unknown";
            break;
        }

        return {
          status,
          progress: typeof progress === "number" ? progress : undefined,
          result: returnValue,
          error: failedReason,
        };
      }
    } catch (error) {
      // Continue to next queue
    }
  }

  // Job not found in any queue
  return {
    status: "unknown",
  };
}
