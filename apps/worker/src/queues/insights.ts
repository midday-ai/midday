import { Queue } from "bullmq";
import { insightsQueueConfig } from "./insights.config";

/**
 * Insights queue instance
 * Used for enqueueing insight generation jobs
 * Configuration is defined in insights.config.ts
 */
export const insightsQueue = new Queue(
  "insights",
  insightsQueueConfig.queueOptions,
);
