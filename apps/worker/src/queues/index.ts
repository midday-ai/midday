import { Queue, type QueueOptions } from "bullmq";
import { redisConnection } from "../config/redis";
import { logger } from "../monitoring/logger";
import type { EmailJobData, EmailJobType } from "../types/email";
import { EMAIL_JOB_PRIORITIES } from "../types/email";

const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: { count: 50, age: 24 * 3600 }, // Keep 50 jobs or 24 hours
    removeOnFail: { count: 50, age: 7 * 24 * 3600 }, // Keep 50 failed jobs or 7 days
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
};

export const emailQueue = new Queue("email", defaultQueueOptions);

export async function enqueueEmailJob(
  data: EmailJobData,
  options: Record<string, any> = {},
) {
  try {
    const job = await emailQueue.add(data.type, data, {
      priority: getEmailJobPriority(data.type),
      ...options,
    });

    logger.info("Email job enqueued", {
      jobId: job.id,
      type: data.type,
      recipient: data.recipientEmail,
      priority: getEmailJobPriority(data.type),
    });

    return job;
  } catch (error) {
    logger.error("Failed to enqueue email job", {
      data,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

// Get job priority from centralized configuration
function getEmailJobPriority(type: EmailJobType): number {
  return EMAIL_JOB_PRIORITIES[type] ?? 1;
}

// Graceful shutdown for queues
export async function closeQueues(): Promise<void> {
  console.log("Closing queues...");
  await emailQueue.close();
  console.log("All queues closed");
}
