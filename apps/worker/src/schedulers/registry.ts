import type { Queue } from "bullmq";
import { documentsQueue } from "../queues/documents";
import { inboxProviderQueue, inboxQueue } from "../queues/inbox";
import { transactionsQueue } from "../queues/transactions";
import type {
  DynamicSchedulerTemplate,
  RegisterDynamicSchedulerParams,
  StaticSchedulerConfig,
} from "../types/scheduler-config";
import { dynamicSchedulerTemplates, staticSchedulerConfigs } from "./index";

/**
 * Get queue instance by name
 */
function getQueueByName(queueName: string): Queue {
  switch (queueName) {
    case "inbox":
      return inboxQueue;
    case "inbox-provider":
      return inboxProviderQueue;
    case "transactions":
      return transactionsQueue;
    case "documents":
      return documentsQueue;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }
}

/**
 * Map to track registered dynamic schedulers
 * Key: job key (e.g., "inbox-sync-{accountId}")
 * Value: Queue instance
 */
const registeredDynamicSchedulers = new Map<string, Queue>();

/**
 * Map to track registered static schedulers
 * Key: scheduler name
 * Value: Queue instance
 */
const registeredStaticSchedulers = new Map<string, Queue>();

/**
 * Register all static schedulers on startup
 * Uses BullMQ's upsertJobScheduler API (v5.16.0+) for better deduplication
 */
export async function registerStaticSchedulers(): Promise<void> {
  console.log(
    `Registering ${staticSchedulerConfigs.length} static scheduler(s)...`,
  );

  for (const config of staticSchedulerConfigs) {
    try {
      const queue = getQueueByName(config.queue);

      // Use upsertJobScheduler for better deduplication and management
      // This ensures the scheduler is updated or created without duplications
      await queue.upsertJobScheduler(
        `scheduler:${config.name}`, // Unique scheduler ID
        {
          pattern: config.cron,
          tz: config.options?.tz ?? "UTC",
          startDate: config.options?.startDate,
          endDate: config.options?.endDate,
          limit: config.options?.limit,
        },
        {
          name: config.jobName,
          data: config.payload ?? {},
          opts: {
            // Job options can be added here if needed
          },
        },
      );

      registeredStaticSchedulers.set(config.name, queue);

      console.log(
        `✅ Registered static scheduler: ${config.name} (${config.cron})`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to register static scheduler ${config.name}:`,
        error,
      );
      throw error;
    }
  }

  console.log(
    `Successfully registered ${registeredStaticSchedulers.size} static scheduler(s)`,
  );
}

/**
 * Register a dynamic scheduler for a specific account
 */
export async function registerDynamicScheduler(
  params: RegisterDynamicSchedulerParams,
): Promise<void> {
  const { template, accountId, cronPattern } = params;

  // Find the template
  const templateConfig = dynamicSchedulerTemplates.find(
    (t) => t.template === template,
  );

  if (!templateConfig) {
    throw new Error(`Dynamic scheduler template not found: ${template}`);
  }

  const jobKey = templateConfig.jobKey(accountId);
  const payload = templateConfig.payloadGenerator(accountId);

  // Check if already registered
  if (registeredDynamicSchedulers.has(jobKey)) {
    console.log(
      `⚠️  Dynamic scheduler already registered: ${jobKey}, skipping...`,
    );
    return;
  }

  try {
    const queue = getQueueByName(templateConfig.queue);

    // Use upsertJobScheduler for better deduplication and management
    // This ensures the scheduler is updated or created without duplications
    await queue.upsertJobScheduler(
      `scheduler:${jobKey}`, // Unique scheduler ID
      {
        pattern: cronPattern,
        tz: templateConfig.options?.tz ?? "UTC",
        startDate: templateConfig.options?.startDate,
        endDate: templateConfig.options?.endDate,
        limit: templateConfig.options?.limit,
      },
      {
        name: templateConfig.jobName,
        data: payload,
        opts: {
          // Job options can be added here if needed
        },
      },
    );

    registeredDynamicSchedulers.set(jobKey, queue);

    console.log(`✅ Registered dynamic scheduler: ${jobKey} (${cronPattern})`);
  } catch (error) {
    console.error(`❌ Failed to register dynamic scheduler ${jobKey}:`, error);
    throw error;
  }
}

/**
 * Unregister a dynamic scheduler
 */
export async function unregisterDynamicScheduler(
  template: string,
  accountId: string,
): Promise<void> {
  const templateConfig = dynamicSchedulerTemplates.find(
    (t) => t.template === template,
  );

  if (!templateConfig) {
    throw new Error(`Dynamic scheduler template not found: ${template}`);
  }

  const jobKey = templateConfig.jobKey(accountId);

  if (!registeredDynamicSchedulers.has(jobKey)) {
    console.log(`⚠️  Dynamic scheduler not registered: ${jobKey}`);
    return;
  }

  try {
    const queue = registeredDynamicSchedulers.get(jobKey);
    if (!queue) {
      return;
    }

    // Remove job scheduler using the scheduler ID
    // With upsertJobScheduler, we can remove by calling removeJobScheduler
    await queue.removeJobScheduler(`scheduler:${jobKey}`);

    registeredDynamicSchedulers.delete(jobKey);

    console.log(`✅ Unregistered dynamic scheduler: ${jobKey}`);
  } catch (error) {
    console.error(
      `❌ Failed to unregister dynamic scheduler ${jobKey}:`,
      error,
    );
    throw error;
  }
}

/**
 * Get all registered dynamic scheduler job keys
 */
export function getRegisteredDynamicSchedulers(): string[] {
  return Array.from(registeredDynamicSchedulers.keys());
}

/**
 * Get all registered static scheduler names
 */
export function getRegisteredStaticSchedulers(): string[] {
  return Array.from(registeredStaticSchedulers.keys());
}
