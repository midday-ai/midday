import type { Database } from "@midday/db/client";
import { logger } from "@worker/monitoring/logger";
import type { Job } from "bullmq";
import type { FlowProducer } from "bullmq";
import type { z } from "zod";

// Job execution context
export interface JobContext {
  job: Job;
  db: Database;
  logger: typeof logger;
}

// Simplified job configuration with smart defaults
interface JobOptions {
  priority?: number;
  attempts?: number;
  delay?: number;
  removeOnComplete?: number;
  removeOnFail?: number;
}

// Flow job definition that integrates with our job system
interface FlowJobDefinition {
  job: SimpleJob<any>;
  data: any;
  options?: Record<string, any>;
  children?: FlowJobDefinition[];
}

// Queue resolver function type
type QueueResolver = (jobId: string) => any;

// Auto-registry for jobs
class SimpleJobRegistry {
  private static instance: SimpleJobRegistry;
  private jobs: Map<string, any> = new Map();
  private queueResolver: QueueResolver | null = null;
  private flowProducer: FlowProducer | null = null;

  static getInstance(): SimpleJobRegistry {
    if (!SimpleJobRegistry.instance) {
      SimpleJobRegistry.instance = new SimpleJobRegistry();
    }
    return SimpleJobRegistry.instance;
  }

  setQueueResolver(resolver: QueueResolver) {
    this.queueResolver = resolver;
  }

  setFlowProducer(producer: FlowProducer) {
    this.flowProducer = producer;
  }

  getFlowProducer(): FlowProducer {
    if (!this.flowProducer) {
      throw new Error("FlowProducer not set. Call setFlowProducer() first.");
    }
    return this.flowProducer;
  }

  getQueue(jobId: string) {
    if (!this.queueResolver) {
      throw new Error("Queue resolver not set. Call setQueueResolver() first.");
    }
    return this.queueResolver(jobId);
  }

  register(id: string, job: any) {
    this.jobs.set(id, job);
    return job;
  }

  get(id: string) {
    return this.jobs.get(id);
  }

  getAll() {
    return Array.from(this.jobs.values());
  }
}

const registry = SimpleJobRegistry.getInstance();

// Clean job class with instance methods and flow support
class SimpleJob<T = any> {
  constructor(
    public id: string,
    private schema: z.ZodSchema<T>,
    private handler: (payload: T, ctx: JobContext) => Promise<any>,
    private options: JobOptions = {},
  ) {}

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

  async trigger(payload: unknown, options: Record<string, any> = {}) {
    const queue = registry.getQueue(this.id);
    const validated = this.validate(payload);

    const job = await queue.add(this.id, validated, {
      priority: this.options.priority ?? 1,
      attempts: this.options.attempts ?? 3,
      delay: this.options.delay ?? options.delay ?? 0,
      removeOnComplete: {
        count: this.options.removeOnComplete ?? 50,
        age: 24 * 3600,
      },
      removeOnFail: {
        count: this.options.removeOnFail ?? 50,
        age: 7 * 24 * 3600,
      },
      backoff: { type: "exponential", delay: 2000 },
      ...options,
    });

    logger.info("Job triggered", { jobId: job.id, type: this.id });
    return job;
  }

  async batchTrigger(
    payloads: Array<{ payload: unknown; options?: Record<string, any> }>,
  ) {
    const queue = registry.getQueue(this.id);

    const bulkJobs = payloads.map(({ payload, options = {} }) => ({
      name: this.id,
      data: this.validate(payload),
      opts: {
        priority: this.options.priority ?? 1,
        attempts: this.options.attempts ?? 3,
        delay: this.options.delay ?? options.delay ?? 0,
        removeOnComplete: {
          count: this.options.removeOnComplete ?? 50,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: this.options.removeOnFail ?? 50,
          age: 7 * 24 * 3600,
        },
        backoff: { type: "exponential", delay: 2000 },
        ...options,
      },
    }));

    const jobs = await queue.addBulk(bulkJobs);
    logger.info("Batch jobs triggered", { count: jobs.length, type: this.id });
    return jobs;
  }

  // Delayed trigger with clean API
  async triggerDelayed(
    payload: unknown,
    delayMs: number,
    options: Record<string, any> = {},
  ) {
    return this.trigger(payload, { ...options, delay: delayMs });
  }

  // Recurring trigger
  async triggerRecurring(
    payload: unknown,
    cron: string,
    options: Record<string, any> = {},
  ) {
    return this.trigger(payload, { ...options, repeat: { pattern: cron } });
  }

  async triggerFlow(flowDef: {
    data: T;
    options?: Record<string, any>;
    children?: FlowJobDefinition[];
  }) {
    const flowProducer = registry.getFlowProducer();
    const validated = this.validate(flowDef.data);

    // Convert our clean flow definition to BullMQ format
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

  // Convert our clean flow definition to BullMQ's FlowJob format
  private convertToBullMqFlow(flowDef: FlowJobDefinition): any {
    const result = {
      name: flowDef.job.id,
      queueName: flowDef.job.getQueueName(),
      data: flowDef.data,
      opts: {
        priority: flowDef.job.options.priority ?? 1,
        attempts: flowDef.job.options.attempts ?? 3,
        removeOnComplete: {
          count: flowDef.job.options.removeOnComplete ?? 50,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: flowDef.job.options.removeOnFail ?? 50,
          age: 7 * 24 * 3600,
        },
        backoff: { type: "exponential", delay: 2000 },
        ...flowDef.options,
      },
      children:
        flowDef.children?.map((child) => this.convertToBullMqFlow(child)) ?? [],
    };

    return result;
  }

  // 🌟 Helper methods for working with flows in job handlers
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

// Job factory function
export function job<T = any>(
  id: string,
  schema: z.ZodSchema<T>,
  handler: (payload: T, ctx: JobContext) => Promise<any>,
  options: JobOptions = {},
): SimpleJob<T> {
  const jobInstance = new SimpleJob(id, schema, handler, options);
  return registry.register(id, jobInstance);
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

// Set flow producer (called during app initialization)
export function setFlowProducer(producer: FlowProducer) {
  registry.setFlowProducer(producer);
}

// Export flow types for easy use
export type { FlowJobDefinition };

// Export registry for queue system
export { registry as jobRegistry };
