import type { Job } from "bullmq";
import { isDevelopment } from "../utils/env";
import { documentProcessors } from "./documents";
import { inboxProcessors } from "./inbox";
import { notificationProcessors } from "./notifications";
import { ratesProcessors } from "./rates";
import { transactionProcessors } from "./transactions";

/**
 * Processor registry - maps job names to processor instances
 * Built from explicit exports in processor directories
 */
const processors = new Map<
  string,
  { handle: (job: Job) => Promise<unknown> }
>();

// Register inbox processors
for (const [jobName, processor] of Object.entries(inboxProcessors)) {
  processors.set(jobName, processor);
}

// Register transaction processors
for (const [jobName, processor] of Object.entries(transactionProcessors)) {
  processors.set(jobName, processor);
}

// Register document processors
for (const [jobName, processor] of Object.entries(documentProcessors)) {
  processors.set(jobName, processor);
}

// Register notification processors
for (const [jobName, processor] of Object.entries(notificationProcessors)) {
  processors.set(jobName, processor);
}

// Register rates processors
for (const [jobName, processor] of Object.entries(ratesProcessors)) {
  processors.set(jobName, processor);
}

// Debug: Log all registered processors
if (isDevelopment()) {
  console.log("Registered processors:", Array.from(processors.keys()));
}

/**
 * Get processor for a job name
 */
export function getProcessor(jobName: string) {
  const processor = processors.get(jobName);
  if (!processor) {
    console.error(
      `Processor not found for job: ${jobName}. Available processors:`,
      Array.from(processors.keys()),
    );
  }
  return processor;
}

/**
 * Check if a processor exists for a job name
 */
export function hasProcessor(jobName: string): boolean {
  return processors.has(jobName);
}
