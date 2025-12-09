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
 * @param jobId - The job ID to query
 * @param options - Optional parameters
 * @param options.queueName - Specific queue name to search (optional)
 * @param options.teamId - Team ID to verify authorization (required for security)
 * @returns Job status response
 * @throws Error if teamId is provided and doesn't match the job's teamId
 */
export async function getJobStatus(
  jobId: string,
  options?: {
    queueName?: string;
    teamId?: string;
  },
): Promise<JobStatusResponse> {
  const queueNames = options?.queueName ? [options.queueName] : KNOWN_QUEUES;
  const requestingTeamId = options?.teamId;

  for (const name of queueNames) {
    const queue = getQueue(name);

    try {
      const job = await queue.getJob(jobId);

      if (job) {
        // Extract teamId from job data payload for authorization check
        const jobData = job.data as { teamId?: string };
        const jobTeamId = jobData?.teamId;

        // If teamId is provided, verify authorization
        if (requestingTeamId) {
          if (!jobTeamId) {
            // Job doesn't have teamId - this is a system job (e.g., rates-scheduler)
            // Users should not be able to access system jobs from their team context
            logger.warn("Attempted to access system job from team context", {
              jobId,
              queueName: name,
              jobName: job.name,
              requestingTeamId,
            });
            throw new Error("Job not found or access denied");
          }
          if (jobTeamId !== requestingTeamId) {
            // Team IDs don't match - unauthorized access attempt
            logger.warn("Unauthorized job access attempt", {
              jobId,
              queueName: name,
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
    } catch (error) {
      // If it's an authorization error, rethrow it
      if (
        error instanceof Error &&
        error.message === "Job not found or access denied"
      ) {
        throw error;
      }
      // Otherwise continue to next queue
    }
  }

  // Job not found in any queue
  return {
    status: "unknown",
  };
}
