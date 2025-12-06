import { createLoggerWithContext } from "@midday/logger";
import { getQueue } from "./queues";
import type { JobStatus, JobStatusResponse, JobTriggerResponse } from "./types";

// Re-export getQueue for use in API routes that need direct queue access
export { getQueue } from "./queues";

// Create logger with job-client context
export const logger = createLoggerWithContext({ component: "job-client" });

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
    logger.info(
      {
        jobName,
        jobId: job.id,
        queueName,
        duration: `${enqueueDuration}ms`,
      },
      "✅ Enqueued job",
    );

    return {
      id: job.id,
    };
  } catch (error) {
    const enqueueDuration = Date.now() - enqueueStartTime;
    logger.error(
      {
        jobName,
        queueName,
        duration: `${enqueueDuration}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "❌ Error triggering job",
    );
    throw error;
  }
}

/**
 * Known queue names in the worker system
 */
const KNOWN_QUEUES = [
  "transactions",
  "inbox",
  "inbox-provider",
  "documents",
  "notifications",
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
