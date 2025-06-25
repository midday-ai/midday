import type { Database } from "@midday/db/client";
import { createClient } from "@midday/supabase/job";
import { logger } from "@worker/monitoring/logger";
import { createBaseQueueOptions } from "@worker/queues/base";
import type { Job, JobNode } from "bullmq";
import { FlowProducer, Queue } from "bullmq";
import type { z } from "zod";

// Job execution context
export interface JobContext {
  job: Job;
  db: Database;
  logger: typeof logger;
  supabase: ReturnType<typeof createClient>;
}

// Job configuration - queue is required, everything else optional with defaults
interface JobOptions {
  queue: string | { name: string; [key: string]: any };
  priority?: number;
  attempts?: number;
  delay?: number;
  removeOnComplete?: number;
  removeOnFail?: number;
}

// Queue resolver function type
type QueueResolver = (jobId: string, queueName: string) => any;

// Simple job metadata registry
class JobRegistry {
  private static instance: JobRegistry;
  private jobs: Map<string, any> = new Map();
  private jobQueues: Map<string, string> = new Map();
  private queueResolver: QueueResolver | null = null;
  private flowProducer: FlowProducer | null = null;
  private externalQueues: Map<string, Queue> = new Map();

  static getInstance(): JobRegistry {
    if (!JobRegistry.instance) {
      JobRegistry.instance = new JobRegistry();
    }
    return JobRegistry.instance;
  }

  register(id: string, job: any, queueName: string) {
    this.jobs.set(id, job);
    this.jobQueues.set(id, queueName);
    return job;
  }

  get(id: string) {
    return this.jobs.get(id);
  }

  getAll() {
    return Array.from(this.jobs.values());
  }

  setQueueResolver(resolver: QueueResolver) {
    this.queueResolver = resolver;
  }

  getFlowProducer(): FlowProducer {
    if (!this.flowProducer) {
      // Create FlowProducer using base configuration
      const baseOptions = createBaseQueueOptions();
      this.flowProducer = new FlowProducer({
        connection: baseOptions.connection,
      });
    }
    return this.flowProducer;
  }

  getQueue(jobId: string) {
    const queueName = this.jobQueues.get(jobId);
    if (!queueName) {
      throw new Error(
        `No queue found for job "${jobId}". Make sure the job has a queue property.`,
      );
    }

    // Try the queue resolver first (worker context)
    if (this.queueResolver) {
      try {
        return this.queueResolver(jobId, queueName);
      } catch (error) {
        // Fall through to external queue creation
      }
    }

    // Create external queue (API context) using base configuration
    if (!this.externalQueues.has(queueName)) {
      const queue = new Queue(queueName, createBaseQueueOptions());
      this.externalQueues.set(queueName, queue);
    }

    return this.externalQueues.get(queueName)!;
  }

  async closeExternalQueues() {
    for (const [name, queue] of this.externalQueues) {
      await queue.close();
      console.log(`Closed external queue: ${name}`);
    }
    this.externalQueues.clear();
  }
}

const registry = JobRegistry.getInstance();

// Flow job definition
interface FlowJobDefinition {
  job: SimpleJob<any>;
  data: any;
  options?: Record<string, any>;
  children?: FlowJobDefinition[];
}

// Clean job class with instance methods and flow support
class SimpleJob<T = any> {
  constructor(
    public id: string,
    public schema: z.ZodSchema<T>,
    private handler: (payload: T, ctx: JobContext) => Promise<any>,
    private options: JobOptions,
  ) {
    // Extract queue name for registration
    const queueName =
      typeof this.options.queue === "string"
        ? this.options.queue
        : this.options.queue.name;
    registry.register(this.id, this, queueName);
  }

  private validate(data: unknown): T {
    try {
      return this.schema.parse(data);
    } catch (error) {
      logger.error("Job validation failed", { jobId: this.id, error });
      throw new Error(
        `Validation failed for ${this.id}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private getQueueName(): string {
    const queue = registry.getQueue(this.id);
    return queue.name;
  }

  async trigger(payload: T, options: Record<string, any> = {}) {
    const queue = registry.getQueue(this.id);
    const validated = this.validate(payload);
    const baseOptions = createBaseQueueOptions().defaultJobOptions || {};

    const job = await queue.add(this.id, validated, {
      priority: this.options.priority ?? baseOptions.priority ?? 1,
      attempts: this.options.attempts ?? baseOptions.attempts ?? 3,
      delay: this.options.delay ?? options.delay ?? 0,
      removeOnComplete:
        this.options.removeOnComplete !== undefined
          ? { count: this.options.removeOnComplete, age: 24 * 3600 }
          : baseOptions.removeOnComplete,
      removeOnFail:
        this.options.removeOnFail !== undefined
          ? { count: this.options.removeOnFail, age: 7 * 24 * 3600 }
          : baseOptions.removeOnFail,
      backoff: baseOptions.backoff,
      ...options,
    });

    console.log(`Job triggered: ${job.id} (${this.id})`);
    return job;
  }

  async batchTrigger(
    payloads: Array<{ payload: T; options?: Record<string, any> }>,
  ) {
    const queue = registry.getQueue(this.id);
    const baseOptions = createBaseQueueOptions().defaultJobOptions || {};

    const bulkJobs = payloads.map(({ payload, options = {} }) => ({
      name: this.id,
      data: this.validate(payload),
      opts: {
        priority: this.options.priority ?? baseOptions.priority ?? 1,
        attempts: this.options.attempts ?? baseOptions.attempts ?? 3,
        delay: this.options.delay ?? options.delay ?? 0,
        removeOnComplete:
          this.options.removeOnComplete !== undefined
            ? { count: this.options.removeOnComplete, age: 24 * 3600 }
            : baseOptions.removeOnComplete,
        removeOnFail:
          this.options.removeOnFail !== undefined
            ? { count: this.options.removeOnFail, age: 7 * 24 * 3600 }
            : baseOptions.removeOnFail,
        backoff: baseOptions.backoff,
        ...options,
      },
    }));

    const jobs = await queue.addBulk(bulkJobs);
    console.log(`Batch jobs triggered: ${jobs.length} (${this.id})`);
    return jobs;
  }

  async triggerDelayed(
    payload: T,
    delayMs: number,
    options: Record<string, any> = {},
  ) {
    return this.trigger(payload, { ...options, delay: delayMs });
  }

  async triggerRecurring(
    payload: T,
    cron: string,
    options: Record<string, any> = {},
  ) {
    return this.trigger(payload, { ...options, repeat: { pattern: cron } });
  }

  async triggerFlow(flowDef: {
    data: T;
    options?: Record<string, any>;
    children?: FlowJobDefinition[];
  }): Promise<JobNode> {
    const flowProducer = registry.getFlowProducer();
    const validated = this.validate(flowDef.data);

    const bullMqFlow = this.convertToBullMqFlow({
      job: this,
      data: validated,
      options: flowDef.options,
      children: flowDef.children,
    });

    const flow = await flowProducer.add(bullMqFlow);

    logger.info("Flow triggered", {
      parentJobId: flow.job.id,
      type: this.id,
      childrenCount: flowDef.children?.length ?? 0,
    });

    return flow;
  }

  private convertToBullMqFlow(flowDef: FlowJobDefinition): any {
    const baseOptions = createBaseQueueOptions().defaultJobOptions || {};

    const result = {
      name: flowDef.job.id,
      queueName: flowDef.job.getQueueName(),
      data: flowDef.data,
      opts: {
        priority: flowDef.job.options.priority ?? baseOptions.priority ?? 1,
        attempts: flowDef.job.options.attempts ?? baseOptions.attempts ?? 3,
        removeOnComplete:
          flowDef.job.options.removeOnComplete !== undefined
            ? { count: flowDef.job.options.removeOnComplete, age: 24 * 3600 }
            : baseOptions.removeOnComplete,
        removeOnFail:
          flowDef.job.options.removeOnFail !== undefined
            ? { count: flowDef.job.options.removeOnFail, age: 7 * 24 * 3600 }
            : baseOptions.removeOnFail,
        backoff: baseOptions.backoff,
        ...flowDef.options,
      },
      children:
        flowDef.children?.map((child) => this.convertToBullMqFlow(child)) ?? [],
    };

    return result;
  }

  static async getChildrenValues(job: Job): Promise<Record<string, any>> {
    return job.getChildrenValues();
  }

  static async getDependencies(job: Job, options?: any): Promise<any> {
    return job.getDependencies(options);
  }

  static async getDependenciesCount(job: Job, options?: any): Promise<any> {
    return job.getDependenciesCount(options);
  }

  async execute(job: Job, db: Database) {
    const validated = this.validate(job.data);
    logger.info("Executing job", { jobId: job.id, type: this.id });

    try {
      const ctx: JobContext = {
        job,
        db,
        logger,
        supabase: createClient(),
      };

      const result = await this.handler(validated, ctx);
      logger.info("Job completed", { jobId: job.id, type: this.id });
      return result;
    } catch (error) {
      logger.error("Job failed", { jobId: job.id, type: this.id, error });
      throw error;
    }
  }
}

export function job<T = any>(
  id: string,
  schema: z.ZodSchema<T>,
  options: JobOptions,
  handler: (payload: T, ctx: JobContext) => Promise<any>,
): SimpleJob<T> {
  return new SimpleJob(id, schema, handler, options);
}

// Execute any job by ID
export async function executeJob(jobId: string, job: Job, db: Database) {
  const jobInstance = registry.get(jobId);
  if (!jobInstance) {
    throw new Error(`No job found for ${jobId}`);
  }
  return jobInstance.execute(job, db);
}

// Set queue resolver (called during app initialization)
export function setQueueResolver(resolver: QueueResolver) {
  registry.setQueueResolver(resolver);
}

// Clean up external queues (useful for external apps)
export async function closeExternalQueues() {
  return registry.closeExternalQueues();
}

// Export flow types for easy use
export type { FlowJobDefinition };

// Export registry for queue system
export { registry as jobRegistry };
