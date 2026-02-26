import { Queue } from "bullmq";
import { collectionsQueueConfig } from "./collections.config";

/**
 * Collections queue instance
 * Used for auto-escalation, SLA breach checks, and follow-up reminders
 */
export const collectionsQueue = new Queue(
  "collections",
  collectionsQueueConfig.queueOptions,
);
