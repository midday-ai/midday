import { createLoggerWithContext } from "@midday/logger";
import * as Sentry from "@sentry/bun";
import type { Job } from "bullmq";
import type { ZodSchema } from "zod";
import {
  classifyError,
  getMaxRetries,
  getRetryDelay,
  isNonRetryableError,
  NonRetryableError,
} from "../utils/error-classification";

/**
 * Base processor class with error handling, retries, and logging
 */
export abstract class BaseProcessor<TData = unknown> {
  protected logger: ReturnType<typeof createLoggerWithContext>;

  constructor() {
    this.logger = createLoggerWithContext(`worker:${this.constructor.name}`);
  }

  /**
   * Optional Zod schema for payload validation
   * Override this in subclasses to enable automatic payload validation
   */
  protected getPayloadSchema(): ZodSchema<TData> | null {
    return null;
  }

  /**
   * Process the job
   * Override this method in subclasses
   */
  abstract process(job: Job<TData>): Promise<unknown>;

  /**
   * Validate job payload using Zod schema if provided
   */
  protected validatePayload(job: Job<TData>): TData {
    const schema = this.getPayloadSchema();
    if (!schema) {
      return job.data;
    }

    try {
      return schema.parse(job.data) as TData;
    } catch (error) {
      this.logger.error("Payload validation failed", {
        jobId: job.id,
        jobName: job.name,
        error: error instanceof Error ? error.message : "Unknown error",
        payload: JSON.stringify(job.data),
      });
      throw new NonRetryableError(
        `Invalid job payload: ${error instanceof Error ? error.message : "Unknown error"}`,
        error,
        "validation",
      );
    }
  }

  /**
   * Main handler called by BullMQ worker
   */
  async handle(job: Job<TData>): Promise<unknown> {
    const startTime = Date.now();

    this.logger.info("Processing job", {
      jobId: job.id,
      jobName: job.name,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
    });

    try {
      // Validate payload if schema is provided (throws on validation error)
      // Store the validated data and update job.data to include any Zod transformations/defaults
      const validatedData = this.validatePayload(job);
      job.data = validatedData;

      // Check idempotency
      const shouldProcess = await this.shouldProcess(job);
      if (!shouldProcess) {
        this.logger.info("Skipping job due to idempotency check", {
          jobId: job.id,
          jobName: job.name,
          idempotencyKey: this.getIdempotencyKey(job),
        });
        return { skipped: true, reason: "idempotency" };
      }

      // Update progress if job has progress tracking
      if (job.opts.removeOnComplete !== false) {
        await this.updateProgress(
          job,
          this.ProgressMilestones.STARTED,
          "Job started",
        );
      }

      // Process with the job (now contains validated/transformed data, preserves prototype methods)
      const result = await this.process(job);

      const duration = Date.now() - startTime;

      // Wrap logger call in try-catch to prevent stream errors from crashing the job
      // This can happen when pino-pretty transport's stream is closing
      try {
        this.logger.info("Job completed", {
          jobId: job.id,
          jobName: job.name,
          duration: `${duration}ms`,
          hasResult: result !== undefined,
          resultType: typeof result,
        });
      } catch (_logError) {
        // Silently ignore logger errors - job already completed successfully
        // This prevents stream encoding errors from affecting job completion
      }

      // Ensure result is JSON-serializable for BullMQ
      // BullMQ stores return values as JSON strings in Redis
      if (result !== undefined && result !== null) {
        try {
          // Test serialization to ensure it's valid JSON
          const serialized = JSON.stringify(result);
          // Check result size (BullMQ has limits, typically 512MB)
          const sizeInMB = new Blob([serialized]).size / (1024 * 1024);
          if (sizeInMB > 100) {
            this.logger.warn("Large job result detected", {
              jobId: job.id,
              jobName: job.name,
              sizeMB: sizeInMB.toFixed(2),
            });
          }
        } catch (error) {
          this.logger.error("Result is not JSON-serializable", {
            jobId: job.id,
            jobName: job.name,
            error: error instanceof Error ? error.message : "Unknown error",
            resultType: typeof result,
            resultKeys:
              result && typeof result === "object"
                ? Object.keys(result)
                : undefined,
          });
          throw new Error(
            `Job result is not JSON-serializable: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      const classified = classifyError(error);

      // Check if this is a non-retryable error
      const isNonRetryable = isNonRetryableError(error);
      const shouldRetry = classified.retryable && !isNonRetryable;
      const remainingAttempts =
        (job.opts.attempts ?? 3) - (job.attemptsMade + 1);

      this.logger.error("Job failed", {
        jobId: job.id,
        jobName: job.name,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts,
        remainingAttempts,
        duration: `${duration}ms`,
        error: errorMessage,
        errorCategory: classified.category,
        retryable: classified.retryable,
        isNonRetryable,
        shouldRetry,
        suggestedRetryDelay: getRetryDelay(error),
        suggestedMaxRetries: getMaxRetries(error),
        stack: errorStack,
      });

      // Only send to Sentry on final attempt or non-retryable errors
      // Avoids noise from retryable failures that will succeed on retry
      if (!shouldRetry || remainingAttempts <= 0) {
        Sentry.captureException(error, {
          tags: {
            jobName: job.name,
            errorCategory: classified.category,
            retryable: String(shouldRetry),
            finalAttempt: String(remainingAttempts <= 0),
          },
          extra: {
            jobId: job.id,
            attempt: job.attemptsMade + 1,
            maxAttempts: job.opts.attempts,
            remainingAttempts,
            duration: `${duration}ms`,
            payload: JSON.stringify(job.data),
          },
        });
      }

      // For non-retryable errors, remove the job from retry queue
      // This prevents unnecessary retries and reduces Redis storage
      if (isNonRetryable && remainingAttempts > 0) {
        try {
          // Move the job to failed state immediately
          // BullMQ will handle this, but we log it for visibility
          this.logger.info(
            "Marking job as non-retryable, skipping remaining attempts",
            {
              jobId: job.id,
              jobName: job.name,
              category: classified.category,
            },
          );
        } catch (removeError) {
          this.logger.warn("Failed to remove non-retryable job from queue", {
            jobId: job.id,
            error:
              removeError instanceof Error
                ? removeError.message
                : "Unknown error",
          });
        }
      }

      // Wrap non-retryable errors in NonRetryableError if not already wrapped
      // This helps BullMQ and monitoring systems identify non-retryable failures
      if (!shouldRetry && !isNonRetryable) {
        const wrappedError = new NonRetryableError(
          errorMessage,
          error,
          classified.category,
        );
        throw wrappedError;
      }

      // Re-throw original error for retryable cases
      throw error;
    }
  }

  /**
   * Update job progress
   * @param job - The BullMQ job
   * @param progress - Progress percentage (0-100)
   * @param message - Optional progress message
   */
  protected async updateProgress(
    job: Job<TData>,
    progress: number,
    message?: string,
  ): Promise<void> {
    // Clamp progress to 0-100
    const clampedProgress = Math.max(0, Math.min(100, progress));

    try {
      // Check if updateProgress method exists and is callable
      // Some job types or BullMQ versions may not have this method
      if (job.updateProgress && typeof job.updateProgress === "function") {
        await job.updateProgress(clampedProgress);
        this.logger.debug("Progress updated", {
          jobId: job.id,
          progress: `${clampedProgress}%`,
          message,
        });
      } else {
        // Silently skip if updateProgress is not available
        this.logger.debug("Progress update skipped (method not available)", {
          jobId: job.id,
          progress: `${clampedProgress}%`,
          message,
        });
      }
    } catch (error) {
      // Don't fail the job if progress update fails
      this.logger.warn("Failed to update job progress", {
        jobId: job.id,
        progress: clampedProgress,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Standard progress milestones for common job patterns
   */
  protected readonly ProgressMilestones = {
    STARTED: 0,
    VALIDATED: 5,
    FETCHED: 10,
    PROCESSING: 25,
    HALFWAY: 50,
    NEARLY_DONE: 75,
    FINALIZING: 90,
    COMPLETED: 100,
  } as const;

  /**
   * Check if a job should be processed (idempotency check)
   * Override this in subclasses to implement custom idempotency logic
   * @param job - The BullMQ job
   * @returns true if job should be processed, false if it should be skipped
   */
  protected async shouldProcess(_job: Job<TData>): Promise<boolean> {
    // Default: always process
    // Subclasses can override to implement idempotency checks
    return true;
  }

  /**
   * Generate an idempotency key for a job
   * Override this in subclasses to generate custom idempotency keys
   * @param job - The BullMQ job
   * @returns An idempotency key string or null if no key should be used
   */
  protected getIdempotencyKey(job: Job<TData>): string | null {
    // Default: use job ID as idempotency key
    // Subclasses can override to generate more specific keys
    return job.id ?? null;
  }
}
