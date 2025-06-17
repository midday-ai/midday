import { logger } from "@worker/monitoring/logger";
import { queueRegistry } from "@worker/queues/base";
import { Queue } from "bullmq";
import { EMAIL_QUEUE_NAME, emailQueueConfig } from "./config";

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, emailQueueConfig);

// Initialize the email queue
export function initializeEmailQueue(): void {
  queueRegistry.registerQueue(EMAIL_QUEUE_NAME, emailQueue);
  logger.info("Email queue initialized", { queueName: EMAIL_QUEUE_NAME });
}
