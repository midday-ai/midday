import { logger } from "@worker/monitoring/logger";
import { queueRegistry } from "@worker/queues/base";
import {
  ENVIRONMENTS,
  getCurrentEnvironment,
  shouldRunScheduledJobs,
} from "@worker/utils/environment";

/**
 * Job Scheduler configurations for all recurring jobs
 * Using modern BullMQ Job Schedulers (v5.16.0+) for better management
 */
const RECURRING_JOB_SCHEDULERS = [
  {
    id: "exchange-rates-updater",
    description: "Updates exchange rates twice daily",
    repeat: {
      pattern: "0 0,12 * * *", // Midnight and noon UTC
      tz: "UTC",
    },
    template: {
      name: "update-rates",
      data: null,
      opts: {
        attempts: 3,
        removeOnComplete: { count: 10, age: 24 * 3600 },
        removeOnFail: { count: 10, age: 7 * 24 * 3600 },
        backoff: { type: "exponential", delay: 10000 },
        // Add job timeout to prevent hanging jobs
        timeout: 5 * 60 * 1000, // 5 minutes
      },
    },
    queue: "system",
  },
] as const;

// Track active schedulers for graceful shutdown
const activeSchedulers = new Set<string>();

/**
 * Initialize all recurring jobs using BullMQ Job Schedulers
 * Called during worker startup to ensure scheduled jobs are active
 * Only runs in production environment to prevent duplicate job execution
 */
export async function initializeRecurringJobs(): Promise<void> {
  const currentEnv = getCurrentEnvironment();

  logger.info("Initializing recurring job schedulers...", {
    environment: currentEnv,
    timezone: "UTC",
    scheduledJobsEnabled: shouldRunScheduledJobs(),
  });

  // Only run scheduled jobs in production environment
  if (!shouldRunScheduledJobs()) {
    logger.info(
      "Skipping scheduled jobs initialization - not in production environment",
      {
        environment: currentEnv,
        requiredEnvironment: ENVIRONMENTS.PRODUCTION,
      },
    );
    return;
  }

  try {
    const results = await Promise.allSettled(
      RECURRING_JOB_SCHEDULERS.map(async (scheduler) => {
        const queue = queueRegistry.getQueue(scheduler.queue);
        if (!queue) {
          throw new Error(
            `Queue "${scheduler.queue}" not found for scheduler "${scheduler.id}"`,
          );
        }

        // Use upsertJobScheduler for safe, duplicate-free scheduling
        const firstJob = await queue.upsertJobScheduler(
          scheduler.id,
          scheduler.repeat,
          scheduler.template,
        );

        // Track active scheduler for cleanup
        activeSchedulers.add(scheduler.id);

        logger.info("Job scheduler initialized", {
          schedulerId: scheduler.id,
          description: scheduler.description,
          pattern: scheduler.repeat.pattern,
          timezone: scheduler.repeat.tz,
          queue: scheduler.queue,
          firstJobId: firstJob.id,
          environment: currentEnv,
        });

        return { schedulerId: scheduler.id, firstJob };
      }),
    );

    // Report results
    const successful = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    if (successful.length > 0) {
      logger.info("Job schedulers initialized successfully", {
        count: successful.length,
        environment: currentEnv,
        schedulers: successful
          .map((r) => (r.status === "fulfilled" ? r.value.schedulerId : null))
          .filter(Boolean),
      });
    }

    if (failed.length > 0) {
      logger.error("Some job schedulers failed to initialize", {
        count: failed.length,
        environment: currentEnv,
        errors: failed
          .map((r) => (r.status === "rejected" ? r.reason : null))
          .filter(Boolean),
      });
    }

    logger.info("Recurring job schedulers initialization complete", {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      environment: currentEnv,
    });
  } catch (error) {
    logger.error("Failed to initialize recurring job schedulers", {
      error: error instanceof Error ? error.message : error,
      environment: currentEnv,
    });
    // Don't throw here - let the worker start even if scheduling fails
    // The jobs can be manually scheduled later if needed
  }
}

/**
 * Gracefully shutdown all active job schedulers
 * Called during worker shutdown to clean up resources
 */
export async function shutdownRecurringJobs(): Promise<void> {
  const currentEnv = getCurrentEnvironment();

  if (activeSchedulers.size === 0) {
    logger.info("No active schedulers to shutdown", {
      environment: currentEnv,
    });
    return;
  }

  logger.info("Shutting down recurring job schedulers...", {
    count: activeSchedulers.size,
    schedulers: Array.from(activeSchedulers),
    environment: currentEnv,
  });

  try {
    const results = await Promise.allSettled(
      Array.from(activeSchedulers).map(async (schedulerId) => {
        // Find the scheduler config to get the queue
        const scheduler = RECURRING_JOB_SCHEDULERS.find(
          (s) => s.id === schedulerId,
        );
        if (!scheduler) {
          logger.warn("Scheduler config not found during shutdown", {
            schedulerId,
          });
          return;
        }

        const queue = queueRegistry.getQueue(scheduler.queue);
        if (!queue) {
          logger.warn("Queue not found during scheduler shutdown", {
            schedulerId,
            queue: scheduler.queue,
          });
          return;
        }

        // Remove the job scheduler
        await queue.removeJobScheduler(schedulerId);
        activeSchedulers.delete(schedulerId);

        logger.info("Job scheduler shutdown", { schedulerId });
        return schedulerId;
      }),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    logger.info("Job schedulers shutdown complete", {
      successful,
      failed,
      remaining: activeSchedulers.size,
      environment: currentEnv,
    });
  } catch (error) {
    logger.error("Error during scheduler shutdown", {
      error: error instanceof Error ? error.message : error,
      environment: currentEnv,
    });
  }
}
