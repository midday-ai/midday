import { Queue } from "bullmq";
import { notificationsQueueConfig } from "./notifications.config";

/**
 * Notifications queue instance
 * Used for enqueueing notification jobs from other parts of the codebase
 * Configuration is defined in notifications.config.ts
 */
export const notificationsQueue = new Queue(
  "notifications",
  notificationsQueueConfig.queueOptions,
);
