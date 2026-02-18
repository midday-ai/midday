import { createLoggerWithContext } from "@midday/logger";
import type { Job } from "bullmq";
import { isDevelopment } from "../utils/env";

const logger = createLoggerWithContext("worker:registry");

import { accountingProcessors } from "./accounting";
import { customerProcessors } from "./customers";
import { documentProcessors } from "./documents";
import { embeddingsProcessors } from "./embeddings";
import { inboxProcessors } from "./inbox";
import { insightsProcessors } from "./insights";
import { institutionsProcessors } from "./institutions";
import { invoiceProcessors } from "./invoices";
import { notificationProcessors } from "./notifications";
import { ratesProcessors } from "./rates";
import { teamProcessors } from "./teams";
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

// Register embeddings processors (separate queue to prevent worker starvation)
for (const [jobName, processor] of Object.entries(embeddingsProcessors)) {
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

// Register rates processors
for (const [jobName, processor] of Object.entries(ratesProcessors)) {
  processors.set(jobName, processor);
}

// Register institutions processors
for (const [jobName, processor] of Object.entries(institutionsProcessors)) {
  processors.set(jobName, processor);
}

// Register accounting processors
for (const [jobName, processor] of Object.entries(accountingProcessors)) {
  processors.set(jobName, processor);
}

// Register invoice processors
for (const [jobName, processor] of Object.entries(invoiceProcessors)) {
  processors.set(jobName, processor);
}

// Register customer processors
for (const [jobName, processor] of Object.entries(customerProcessors)) {
  processors.set(jobName, processor);
}

// Register team processors
for (const [jobName, processor] of Object.entries(teamProcessors)) {
  processors.set(jobName, processor);
}

// Register insights processors
for (const [jobName, processor] of Object.entries(insightsProcessors)) {
  processors.set(jobName, processor);
}

// Register notification processors
for (const [jobName, processor] of Object.entries(notificationProcessors)) {
  processors.set(jobName, processor);
}

// Debug: Log all registered processors
if (isDevelopment()) {
  logger.info("Registered processors", {
    processors: Array.from(processors.keys()),
  });
}

/**
 * Get processor for a job name
 */
export function getProcessor(jobName: string) {
  const processor = processors.get(jobName);
  if (!processor) {
    logger.error(
      `Processor not found for job: ${jobName}. Available processors:`,
      {
        availableProcessors: Array.from(processors.keys()),
      },
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
