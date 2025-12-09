import { Queue } from "bullmq";
import { ratesQueueConfig } from "./rates.config";

/**
 * Rates queue instance
 * Used for enqueueing rates scheduler jobs
 * Configuration is defined in rates.config.ts
 */
export const ratesQueue = new Queue("rates", ratesQueueConfig.queueOptions);
