import { logger } from "@worker/monitoring/logger";
import { queueRegistry } from "@worker/queues/base";
import { Queue } from "bullmq";
import { DOCUMENT_QUEUE_NAME, documentQueueConfig } from "./config";

export const documentQueue = new Queue(
  DOCUMENT_QUEUE_NAME,
  documentQueueConfig,
);

// Initialize the document queue
export function initializeDocumentQueue(): void {
  queueRegistry.registerQueue(DOCUMENT_QUEUE_NAME, documentQueue);
  logger.info("Document queue initialized", { queueName: DOCUMENT_QUEUE_NAME });
}
