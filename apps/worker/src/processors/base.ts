import type { Job } from "bullmq";
import pino from "pino";
import { classifyError } from "../utils/error-classification";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

/**
 * Base processor class with error handling, retries, and logging
 */
export abstract class BaseProcessor<TData = unknown> {
  protected logger: pino.Logger;

  constructor() {
    this.logger = logger.child({ processor: this.constructor.name });
  }

  /**
   * Process the job
   * Override this method in subclasses
   */
  abstract process(job: Job<TData>): Promise<unknown>;

  /**
   * Main handler called by BullMQ worker
   */
  async handle(job: Job<TData>): Promise<unknown> {
    const startTime = Date.now();

    this.logger.info(
      {
        jobId: job.id,
        jobName: job.name,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts,
      },
      "Processing job",
    );

    try {
      // Update progress if job has progress tracking
      if (job.opts.removeOnComplete !== false) {
        await job.updateProgress(0);
      }

      const result = await this.process(job);

      const duration = Date.now() - startTime;

      this.logger.info(
        {
          jobId: job.id,
          jobName: job.name,
          duration: `${duration}ms`,
          hasResult: result !== undefined,
          resultType: typeof result,
        },
        "Job completed",
      );

      // Ensure result is JSON-serializable for BullMQ
      // BullMQ stores return values as JSON strings in Redis
      if (result !== undefined && result !== null) {
        try {
          // Test serialization to ensure it's valid JSON
          JSON.stringify(result);
        } catch (error) {
          this.logger.error(
            {
              jobId: job.id,
              jobName: job.name,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            "Result is not JSON-serializable",
          );
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

      this.logger.error(
        {
          jobId: job.id,
          jobName: job.name,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
          duration: `${duration}ms`,
          error: errorMessage,
          errorCategory: classified.category,
          retryable: classified.retryable,
          stack: errorStack,
        },
        "Job failed",
      );

      // Re-throw to let BullMQ handle retries
      throw error;
    }
  }

  /**
   * Update job progress
   */
  protected async updateProgress(
    job: Job<TData>,
    progress: number,
  ): Promise<void> {
    await job.updateProgress(progress);
    this.logger.debug(
      {
        jobId: job.id,
        progress: `${progress}%`,
      },
      "Progress updated",
    );
  }
}
