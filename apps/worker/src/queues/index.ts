import { setFlowProducer, setQueueResolver } from "@worker/jobs";
import { logger } from "@worker/monitoring/logger";
import { queueRegistry } from "@worker/queues/base";
import { initializeDocumentQueue } from "@worker/queues/documents";
import { initializeEmailQueue } from "@worker/queues/email";
import { FlowProducer } from "bullmq";

// Initialize all queues
export async function initializeAllQueues(): Promise<void> {
  logger.info("Initializing all queues...");

  // Initialize each queue type
  initializeEmailQueue();
  initializeDocumentQueue();

  // Set up queue resolver - determines which queue each job goes to
  setQueueResolver((jobId: string) => {
    // Email-related jobs go to email queue
    if (
      jobId.includes("email") ||
      jobId.includes("onboard") ||
      jobId.includes("invite")
    ) {
      return queueRegistry.getQueue("email");
    }

    // Document-related jobs go to documents queue
    if (
      jobId.includes("document") ||
      jobId.includes("pdf") ||
      jobId.includes("extract")
    ) {
      return queueRegistry.getQueue("documents");
    }

    // Default to email queue for other jobs
    return queueRegistry.getQueue("email");
  });

  // Initialize FlowProducer for flow support
  const flowProducer = new FlowProducer();
  setFlowProducer(flowProducer);

  logger.info("All queues initialized", {
    queueCount: queueRegistry.getAllQueues().length,
    queueNames: queueRegistry.getAllQueues().map((q) => q.name),
    flowsEnabled: true,
  });
}

// Export commonly used functions
export const getAllQueues = () => queueRegistry.getAllQueues();
export const getQueue = (name: string) => queueRegistry.getQueue(name);
export const closeQueues = async () => {
  await queueRegistry.closeAll();
  // Close FlowProducer connections too
  const flowProducer = new FlowProducer();
  await flowProducer.close();
};

export * from "@worker/queues/base";
export * from "@worker/queues/documents";
export * from "@worker/queues/email";
