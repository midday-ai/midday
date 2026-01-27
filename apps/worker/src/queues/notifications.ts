import { Queue } from "bullmq";
import { notificationsQueueConfig } from "./notifications.config";

/**
 * Notifications queue instance
 * Unified queue for all notification types
 * Configuration is defined in notifications.config.ts
 */
export const notificationsQueue = new Queue(
  "notifications",
  notificationsQueueConfig.queueOptions,
);
