import type { JobsOptions } from "bullmq";
import {
  flowProducer,
  inboxProviderQueue,
  inboxQueue,
  transactionsQueue,
} from "./config";
import { getQueueForJob, getQueueNameForJob } from "./registry";
import type { Job as JobType } from "./types";

export interface JobOptions {
  priority?: number;
  delay?: number;
  jobId?: string;
}

/**
 * Jobs API - mimics trigger.dev's tasks.trigger() style
 * Automatically routes to the correct queue based on job name
 *
 * Usage:
 *   jobs.trigger("batch-process-matching", { teamId, inboxIds })
 *   jobs.trigger("embed-inbox", { inboxId, teamId })
 */
export const jobs = {
  /**
   * Trigger a job - (async, doesn't wait)
   * Usage: jobs.trigger("job-name", payload, options?)
   */
  async trigger<T extends JobType["name"]>(
    name: T,
    data: Extract<JobType, { name: T }>["data"],
    options?: JobOptions,
  ): Promise<{ id: string }> {
    const queue = getQueueForJob(name);

    const jobOptions: Record<string, unknown> = {
      ...(options?.priority !== undefined && { priority: options.priority }),
      ...(options?.delay !== undefined && { delay: options.delay }),
      ...(options?.jobId !== undefined && { jobId: options.jobId }),
    };

    // For export jobs, increase lock duration to prevent stalling
    // Export jobs can take several minutes with large datasets
    if (name === "export-transactions") {
      jobOptions.removeOnComplete = false; // Keep completed jobs for status polling
      jobOptions.removeOnFail = false; // Keep failed jobs for debugging
      // Lock duration: 10 minutes (600000ms) - enough time for large exports
      jobOptions.lockDuration = 10 * 60 * 1000;
    }

    const addedJob = await queue.add(name, data, jobOptions);

    return { id: addedJob.id! };
  },
};

/**
 * Create a job flow for dependent jobs
 * Uses BullMQ FlowProducer for parent-child relationships
 * Automatically determines queue names from job names
 *
 * Usage:
 *   createJobFlow([
 *     { jobName: "process-attachment", data: {...} },
 *     { jobName: "embed-inbox", data: {...} },
 *     { jobName: "batch-process-matching", data: {...} }
 *   ])
 */
export async function createJobFlow(
  flowJobs: Array<{
    jobName: string;
    data: unknown;
    options?: {
      priority?: number;
      delay?: number;
    };
  }>,
): Promise<{ id: string }> {
  if (flowJobs.length === 0) {
    throw new Error("At least one job is required for a flow");
  }

  // First job is the parent
  const parentJob = flowJobs[0];
  if (!parentJob) {
    throw new Error("Parent job is required");
  }

  const parentQueueName = getQueueNameForJob(parentJob.jobName);

  const flow = {
    queueName: parentQueueName,
    name: parentJob.jobName,
    data: parentJob.data,
    opts: {
      ...(parentJob.options?.priority !== undefined && {
        priority: parentJob.options.priority,
      }),
      ...(parentJob.options?.delay !== undefined && {
        delay: parentJob.options.delay,
      }),
    },
    children: flowJobs.slice(1).map((child) => ({
      queueName: getQueueNameForJob(child.jobName),
      name: child.jobName,
      data: child.data,
      opts: {
        ...(child.options?.priority !== undefined && {
          priority: child.options.priority,
        }),
        ...(child.options?.delay !== undefined && {
          delay: child.options.delay,
        }),
      },
    })),
  };

  const addedFlow = await flowProducer.add(flow);

  return { id: addedFlow.job.id! };
}

/**
 * Get job status by ID across all queues
 * Tries each queue sequentially until job is found
 *
 * Uses direct Redis HGETALL to ensure fresh data is retrieved
 */
export async function getJobStatus(jobId: string): Promise<{
  status: "waiting" | "active" | "completed" | "failed" | "delayed" | "unknown";
  progress?: number;
  result?: unknown;
  error?: string;
} | null> {
  // Queue names and their instances - order by most likely to contain the job
  const queueConfigs = [
    { name: "transactions", queue: transactionsQueue },
    { name: "inbox", queue: inboxQueue },
    { name: "inbox-provider", queue: inboxProviderQueue },
  ];

  for (const { name: queueName, queue } of queueConfigs) {
    // Get the Redis client from the queue
    // BullMQ queue.client returns a Promise<Redis>
    const client = await queue.client;

    // Fetch raw job data directly from Redis using HGETALL
    // BullMQ stores jobs in hash keys: bull:{queueName}:{jobId}
    const jobKey = `bull:${queueName}:${jobId}`;
    const rawJobData = await client.hgetall(jobKey);

    // If no data found, try next queue
    if (!rawJobData || Object.keys(rawJobData).length === 0) {
      continue;
    }

    // Parse the raw job data
    // BullMQ stores these fields: name, data, opts, progress, attemptsMade,
    // finishedOn, processedOn, failedReason, returnvalue, etc.
    const returnValue = rawJobData.returnvalue;
    const failedReason = rawJobData.failedReason;
    const finishedOn = rawJobData.finishedOn;
    const rawProgress = rawJobData.progress;

    // Determine job state by checking which list/set the job is in
    // Check completed set first since that's what we're interested in
    const isInCompleted = await client.zscore(
      `bull:${queueName}:completed`,
      jobId,
    );
    const isInFailed = await client.zscore(`bull:${queueName}:failed`, jobId);
    const isInActive = await client.lpos(`bull:${queueName}:active`, jobId);
    const isInWaiting = await client.lpos(`bull:${queueName}:wait`, jobId);
    const isInDelayed = await client.zscore(`bull:${queueName}:delayed`, jobId);

    // Determine status
    let status:
      | "waiting"
      | "active"
      | "completed"
      | "failed"
      | "delayed"
      | "unknown";

    if (isInCompleted !== null) {
      status = "completed";
    } else if (isInFailed !== null) {
      status = "failed";
    } else if (isInActive !== null) {
      status = "active";
    } else if (isInWaiting !== null) {
      status = "waiting";
    } else if (isInDelayed !== null) {
      status = "delayed";
    } else if (finishedOn) {
      // Job has finishedOn but not in completed set - likely completed
      status = "completed";
    } else {
      status = "unknown";
    }

    // Parse progress - can be a number or JSON object
    let progress: number | undefined;
    if (rawProgress) {
      try {
        const parsed = JSON.parse(rawProgress);
        if (typeof parsed === "number") {
          progress = parsed;
        } else if (typeof parsed === "object" && "percentage" in parsed) {
          progress = parsed.percentage;
        }
      } catch {
        // If not valid JSON, try as number
        const num = Number(rawProgress);
        if (!Number.isNaN(num)) {
          progress = num;
        }
      }
    }

    // Parse return value
    let parsedResult: unknown = undefined;
    if (returnValue) {
      try {
        parsedResult = JSON.parse(returnValue);
      } catch {
        parsedResult = returnValue;
      }
    }

    // Log for debugging
    console.log(`[getJobStatus] Queue: ${queueName}, JobId: ${jobId}`, {
      status,
      progress,
      hasReturnValue: !!returnValue,
      returnValueLength: returnValue?.length,
      rawProgress,
      finishedOn,
      isInCompleted: isInCompleted !== null,
    });

    return {
      status,
      progress,
      result: parsedResult,
      error: failedReason || undefined,
    };
  }

  // Job not found in any queue
  console.log(`[getJobStatus] Job ${jobId} not found in any queue`);
  return null;
}
