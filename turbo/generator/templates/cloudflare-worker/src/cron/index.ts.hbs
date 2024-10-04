import { LoggerSingleton } from "../pkg/logger";
import { cronJobs } from "./cron";
import { z } from "zod";
import { CronJob } from "./job";

// Define the environment variables we expect
const EnvSchema = z.object({
  CLOUDFLARE_API_TOKEN: z.string(),
  ENVIRONMENT: z
    .enum(["development", "staging", "production"])
    .default("development"),
});

type Env = z.infer<typeof EnvSchema>;

/**
 * Safely executes a cron job and handles any errors that occur during execution.
 *
 * @param job - The cron job to execute
 * @param logger - The logger instance to use for logging
 *
 * @example
 * const job: CronJob = {
 *   name: "Daily Cleanup",
 *   description: "Removes old data from the database",
 *   handler: async () => { // cleanup logic },
 *   requiresCloudflareAPI: false
 * };
 * await safeExecute(job, logger);
 */
async function safeExecute(
  job: CronJob,
  logger: ReturnType<typeof LoggerSingleton.getInstance>,
) {
  const startTime = Date.now();
  try {
    await job.handler();
    const duration = Date.now() - startTime;
    logger.info(`Completed job: ${job.name} in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      `Job ${job.name} failed after ${duration}ms: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Calls the Cloudflare API to retrieve IP information.
 *
 * @param apiToken - The Cloudflare API token to use for authentication
 * @param logger - The logger instance to use for logging
 * @returns The data returned by the Cloudflare API
 * @throws Will throw an error if the API call fails
 *
 * @example
 * try {
 *   const data = await callCloudflareAPI(env.CLOUDFLARE_API_TOKEN, logger);
 *   console.log(data);
 * } catch (error) {
 *   console.error("Failed to call Cloudflare API", error);
 * }
 */
async function callCloudflareAPI(
  apiToken: string,
  logger: ReturnType<typeof LoggerSingleton.getInstance>,
) {
  try {
    const resp = await fetch("https://api.cloudflare.com/client/v4/ips", {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!resp.ok) {
      throw new Error(`API call failed with status: ${resp.status}`);
    }
    const data = await resp.json();
    logger.debug(`Cloudflare API response: ${JSON.stringify(data)}`);
    return data;
  } catch (error) {
    logger.error(
      `Error calling Cloudflare API: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error; // Re-throw to allow caller to handle
  }
}

/**
 * Type definition for the cron function
 */
export type CronFunction = (
  event: { cron: string },
  env: Env,
  ctx: ExecutionContext,
) => Promise<void>;

/**
 * Executes a cron job based on the provided cron string.
 *
 * This function validates the environment, executes the appropriate job,
 * calls the Cloudflare API if required, and handles any errors that occur.
 *
 * @param event - The event object containing the cron string
 * @param env - The environment variables
 * @param ctx - The execution context
 *
 * @example
 * // Assuming this is set up as a Cloudflare Worker:
 * export default {
 *   async scheduled(event, env, ctx) {
 *     await cron(event, env, ctx);
 *   }
 * };
 */
const cron: CronFunction = async (event, env, ctx) => {
  const logger = LoggerSingleton.getInstance();

  try {
    // Validate environment variables
    const validatedEnv = EnvSchema.parse(env);

    // Execute the cron job
    const job = cronJobs[event.cron];
    if (job) {
      logger.info(`Starting job: ${job.name} - ${job.description}`);
      await safeExecute(job, logger);
    } else {
      logger.warn(`No job defined for cron: ${event.cron}`);
      return; // Exit early if no job is found
    }

    // Call Cloudflare API (if needed)
    if (job.requiresCloudflareAPI) {
      try {
        await callCloudflareAPI(validatedEnv.CLOUDFLARE_API_TOKEN, logger);
      } catch (error) {
        // Handle API error (e.g., retry logic, notifications, etc.)
        logger.warn(
          `Cloudflare API call failed, but job execution will continue`,
        );
      }
    }

    // Add any post-job operations here
    logger.info(`Cron job execution completed successfully`);
  } catch (error) {
    logger.error(
      `Cron job error: ${error instanceof Error ? error.message : String(error)}`,
    );
    // Depending on your error handling strategy, you might want to:
    // - Send an alert
    // - Update a status in a database
    // - Retry the job
    // throw error; // Uncomment if you want to mark the cron execution as failed
  } finally {
    // Perform any cleanup operations here
    logger.info(`Cron job process finished`);
  }
};

export default cron;
