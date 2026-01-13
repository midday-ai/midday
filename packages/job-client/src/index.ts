import { createLoggerWithContext } from "@midday/logger";
import { getQueue } from "./queues";
import type { JobStatus, JobStatusResponse, JobTriggerResponse } from "./types";
import { decodeJobId, encodeJobId } from "./utils";

// Re-export utilities
export { getQueue } from "./queues";
export { decodeJobId, encodeJobId } from "./utils";

// Create logger with job-client context
export const logger = createLoggerWithContext("job-client");

/**
 * Options for triggering a job
 */
export interface TriggerJobOptions {
  /** Delay in milliseconds before the job starts processing */
  delay?: number;
  /** Custom job ID for deduplication - BullMQ will reject duplicates with the same jobId */
  jobId?: string;
}

/**
 * Trigger a job in the specified queue
 * @param jobName - Name of the job (e.g., "export-transactions")
 * @param payload - Job payload data
 * @param queueName - Name of the queue (e.g., "transactions", "inbox", "inbox-provider")
 * @param options - Optional job options (delay, etc.)
 * @returns Job information including the job ID
 */
export async function triggerJob(
  jobName: string,
  payload: unknown,
  queueName: string,
  options?: TriggerJobOptions,
): Promise<JobTriggerResponse> {
  const queue = getQueue(queueName);
  const enqueueStartTime = Date.now();

  try {
    const job = await queue.add(jobName, payload, {
      delay: options?.delay,
      jobId: options?.jobId,
    });

    if (!job?.id) {
      throw new Error(
        `Failed to create job: ${jobName} in queue: ${queueName}`,
      );
    }

    const enqueueDuration = Date.now() - enqueueStartTime;
    const compositeId = encodeJobId(queueName, job.id);
    logger.info("Enqueued job", {
      jobName,
      jobId: compositeId,
      queueName,
      customJobId: options?.jobId,
      duration: `${enqueueDuration}ms`,
    });

    return {
      id: compositeId,
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
 * Trigger a job and wait for it to complete
 * @param jobName - Name of the job (e.g., "embed-inbox")
 * @param payload - Job payload data
 * @param queueName - Name of the queue (e.g., "inbox")
 * @param options - Optional parameters
 * @param options.timeout - Maximum time to wait in milliseconds (default: 60000)
 * @param options.jobId - Custom job ID for deduplication
 * @returns Job information including the job ID and result
 */
export async function triggerJobAndWait(
  jobName: string,
  payload: unknown,
  queueName: string,
  options?: { timeout?: number; jobId?: string },
): Promise<JobTriggerResponse & { result?: unknown }> {
  const queue = getQueue(queueName);
  const enqueueStartTime = Date.now();
  const timeout = options?.timeout ?? 60000; // Default 60 seconds

  try {
    const job = await queue.add(jobName, payload, {
      jobId: options?.jobId,
    });

    if (!job?.id) {
      throw new Error(
        `Failed to create job: ${jobName} in queue: ${queueName}`,
      );
    }

    const compositeId = encodeJobId(queueName, job.id);
    const enqueueDuration = Date.now() - enqueueStartTime;
    logger.info("Enqueued job (waiting for completion)", {
      jobName,
      jobId: compositeId,
      queueName,
      enqueueDuration: `${enqueueDuration}ms`,
    });

    // Wait for job to complete by polling its state
    // Note: waitUntilFinished() is NOT recommended when called from within a worker
    // as it can cause stalled jobs and block the event loop. Polling is the safer approach.
    const waitStartTime = Date.now();
    const initialPollInterval = 50; // Start with 50ms for fast jobs
    const maxPollInterval = 200; // Cap at 200ms for longer waits
    let pollInterval = initialPollInterval;
    let pollCount = 0;
    let jobState: string | null = null;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      jobState = await job.getState();

      if (jobState === "completed") {
        const waitDuration = Date.now() - waitStartTime;
        const totalDuration = Date.now() - enqueueStartTime;
        logger.info("Job completed (via polling)", {
          jobName,
          jobId: compositeId,
          queueName,
          waitDuration: `${waitDuration}ms`,
          totalDuration: `${totalDuration}ms`,
          pollCount,
        });
        break;
      }

      if (jobState === "failed") {
        const failedReason = job.failedReason || "Unknown error";
        throw new Error(`Job failed: ${failedReason}`);
      }

      // Exponential backoff: poll more frequently at first, then slow down
      // This reduces Redis load for longer-running jobs while keeping fast jobs responsive
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      pollCount++;

      // Increase poll interval gradually (exponential backoff)
      // After 5 polls (250ms), increase to 100ms
      // After 10 polls (1.25s), increase to 200ms max
      if (pollCount === 5) {
        pollInterval = 100;
      } else if (pollCount === 10) {
        pollInterval = maxPollInterval;
      }
    }

    // Check final state if we timed out
    if (Date.now() - startTime >= timeout) {
      const finalState = await job.getState();
      if (finalState !== "completed") {
        throw new Error(
          `Job did not complete within ${timeout}ms timeout. Final state: ${finalState}`,
        );
      }
    }

    const waitDuration = Date.now() - waitStartTime;
    const totalDuration = Date.now() - enqueueStartTime;

    // Refetch the job to get the return value from Redis
    // The original job object doesn't automatically sync after completion
    const completedJob = await queue.getJob(job.id);
    const result = completedJob?.returnvalue;

    logger.info("Job completed successfully", {
      jobName,
      jobId: compositeId,
      queueName,
      waitDuration: `${waitDuration}ms`,
      totalDuration: `${totalDuration}ms`,
      pollCount,
    });

    return {
      id: compositeId,
      result,
    };
  } catch (error) {
    const totalDuration = Date.now() - enqueueStartTime;
    logger.error("Error triggering job or waiting for completion", {
      jobName,
      queueName,
      duration: `${totalDuration}ms`,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Get job status by composite ID
 * The composite ID encodes both queue name and job ID (e.g., "accounting:21")
 * @param compositeJobId - The composite job ID (format: "queueName:jobId")
 * @param options - Optional parameters
 * @param options.teamId - Team ID to verify authorization (required for security)
 * @returns Job status response
 * @throws Error if teamId is provided and doesn't match the job's teamId
 */
export async function getJobStatus(
  compositeJobId: string,
  options?: {
    teamId?: string;
  },
): Promise<JobStatusResponse> {
  const { queueName, jobId } = decodeJobId(compositeJobId);
  const requestingTeamId = options?.teamId;
  const queue = getQueue(queueName);

  const job = await queue.getJob(jobId);

  if (!job) {
    // Job not found
    return {
      status: "unknown",
    };
  }

  // Extract teamId from job data payload for authorization check
  const jobData = job.data as { teamId?: string };
  const jobTeamId = jobData?.teamId;

  // If teamId is provided, verify authorization
  if (requestingTeamId) {
    if (!jobTeamId) {
      // Job doesn't have teamId - this is a system job (e.g., rates-scheduler)
      // Users should not be able to access system jobs from their team context
      logger.warn("Attempted to access system job from team context", {
        jobId: compositeJobId,
        queueName,
        jobName: job.name,
        requestingTeamId,
      });
      throw new Error("Job not found or access denied");
    }
    if (jobTeamId !== requestingTeamId) {
      // Team IDs don't match - unauthorized access attempt
      logger.warn("Unauthorized job access attempt", {
        jobId: compositeJobId,
        queueName,
        jobName: job.name,
        requestingTeamId,
        jobTeamId,
      });
      throw new Error("Job not found or access denied");
    }
  }

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
