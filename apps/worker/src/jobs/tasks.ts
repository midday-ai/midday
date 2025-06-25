import { createBaseQueueOptions, queueRegistry } from "@worker/queues/base";
import { Queue } from "bullmq";
import type { z } from "zod";

interface TriggerOptions {
  delay?: string | number; // "1h", "30m", 5000 (ms)
  priority?: number;
  attempts?: number;
  removeOnComplete?: number;
  removeOnFail?: number;
}

interface BatchTriggerOptions extends TriggerOptions {}

// Convert delay string to milliseconds
function parseDelay(delay: string | number): number {
  if (typeof delay === "number") {
    return delay;
  }

  const match = delay.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(
      `Invalid delay format: ${delay}. Use format like "5m", "1h", "30s", "1d"`,
    );
  }

  const [, amount, unit] = match;
  if (!amount) {
    throw new Error(`Invalid delay format: ${delay}`);
  }
  const value = Number.parseInt(amount, 10);

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid delay unit: ${unit}`);
  }
}

class JobTriggerClient {
  private externalQueues: Map<string, Queue> = new Map();

  private getQueue(queueName: string): Queue {
    // First try to get from the main queue registry (worker context)
    const registeredQueue = queueRegistry.getQueue(queueName);
    if (registeredQueue) {
      return registeredQueue;
    }

    // Create external queue for API context if not in registry
    if (!this.externalQueues.has(queueName)) {
      const queue = new Queue(queueName, createBaseQueueOptions());
      this.externalQueues.set(queueName, queue);
    }

    return this.externalQueues.get(queueName)!;
  }

  /**
   * Trigger a job using schema directly
   * @param schema - The job schema for validation
   * @param queueName - The queue name
   * @param jobName - The job name
   * @param payload - The job payload
   * @param options - Optional trigger options
   */
  async trigger<T>(
    schema: z.ZodSchema<T>,
    queueName: string,
    jobName: string,
    payload: T,
    options: TriggerOptions = {},
  ) {
    const validated = schema.parse(payload);
    const queue = this.getQueue(queueName);

    // Get base options from queue configuration, allow options to override
    const baseOptions = createBaseQueueOptions().defaultJobOptions || {};

    const job = await queue.add(jobName, validated, {
      priority: options.priority ?? baseOptions.priority ?? 1,
      attempts: options.attempts ?? baseOptions.attempts ?? 3,
      delay: options.delay ? parseDelay(options.delay) : 0,
      removeOnComplete:
        options.removeOnComplete !== undefined
          ? { count: options.removeOnComplete, age: 24 * 3600 }
          : baseOptions.removeOnComplete,
      removeOnFail:
        options.removeOnFail !== undefined
          ? { count: options.removeOnFail, age: 7 * 24 * 3600 }
          : baseOptions.removeOnFail,
      backoff: baseOptions.backoff,
    });

    console.log(`Job triggered: ${job.id} (${jobName})`);
    return { id: job.id, name: jobName };
  }

  /**
   * Trigger multiple jobs using schema directly
   * @param schema - The job schema for validation
   * @param queueName - The queue name
   * @param jobName - The job name
   * @param payloads - Array of payloads with optional per-job options
   */
  async batchTrigger<T>(
    schema: z.ZodSchema<T>,
    queueName: string,
    jobName: string,
    payloads: Array<{
      payload: T;
      options?: BatchTriggerOptions;
    }>,
  ) {
    const queue = this.getQueue(queueName);
    const baseOptions = createBaseQueueOptions().defaultJobOptions || {};

    const bulkJobs = payloads.map(({ payload, options = {} }) => ({
      name: jobName,
      data: schema.parse(payload), // Validate each payload
      opts: {
        priority: options.priority ?? baseOptions.priority ?? 1,
        attempts: options.attempts ?? baseOptions.attempts ?? 3,
        delay: options.delay ? parseDelay(options.delay) : 0,
        removeOnComplete:
          options.removeOnComplete !== undefined
            ? { count: options.removeOnComplete, age: 24 * 3600 }
            : baseOptions.removeOnComplete,
        removeOnFail:
          options.removeOnFail !== undefined
            ? { count: options.removeOnFail, age: 7 * 24 * 3600 }
            : baseOptions.removeOnFail,
        backoff: baseOptions.backoff,
      },
    }));

    const jobs = await queue.addBulk(bulkJobs);
    console.log(`Batch jobs triggered: ${jobs.length} (${jobName})`);

    return jobs.map((job) => ({ id: job.id, name: jobName }));
  }

  async close() {
    // Close external queues (API context)
    for (const [name, queue] of this.externalQueues) {
      await queue.close();
      console.log(`Closed external queue: ${name}`);
    }
    this.externalQueues.clear();

    // Note: Don't close registered queues as they're managed by the queue registry
  }
}

// Singleton instance
export const tasks = new JobTriggerClient();
