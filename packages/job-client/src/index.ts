import { getQueue } from "./queues";
import type { JobStatus, JobStatusResponse, JobTriggerResponse } from "./types";

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

  try {
    const job = await queue.add(jobName, payload);

    if (!job?.id) {
      throw new Error(
        `Failed to create job: ${jobName} in queue: ${queueName}`,
      );
    }

    return {
      id: job.id,
    };
  } catch (error) {
    console.error(
      `[Job Client] Error triggering job ${jobName} in queue ${queueName}:`,
      error,
    );
    throw error;
  }
}

/**
 * Trigger a job and wait for it to complete
 * @param jobName - Name of the job (e.g., "embed-inbox")
 * @param payload - Job payload data
 * @param queueName - Name of the queue (e.g., "transactions", "inbox", "inbox-provider")
 * @returns Job result after completion
 */
export async function triggerJobAndWait(
  jobName: string,
  payload: unknown,
  queueName: string,
): Promise<unknown> {
  const queue = getQueue(queueName);

  try {
    const job = await queue.add(jobName, payload);

    if (!job?.id) {
      throw new Error(
        `Failed to create job: ${jobName} in queue: ${queueName}`,
      );
    }

    // Wait for the job to complete
    return await job.waitUntilFinished();
  } catch (error) {
    console.error(
      `[Job Client] Error triggering and waiting for job ${jobName} in queue ${queueName}:`,
      error,
    );
    throw error;
  }
}

/**
 * Known queue names in the worker system
 */
const KNOWN_QUEUES = ["transactions", "inbox", "inbox-provider", "documents"];

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
