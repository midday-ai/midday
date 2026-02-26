import type { Job } from "bullmq";
import { isDevelopment } from "../utils/env";
import { accountingProcessors } from "./accounting";
import { merchantProcessors } from "./merchants";
import { documentProcessors } from "./documents";
import { embeddingsProcessors } from "./embeddings";
import { inboxProcessors } from "./inbox";
import { dealProcessors } from "./deals";
import { ratesProcessors } from "./rates";
import { teamProcessors } from "./teams";
import { transactionProcessors } from "./transactions";
import { collectionsProcessors } from "./collections";
import { disclosureProcessors } from "./disclosures";

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

// Register accounting processors
for (const [jobName, processor] of Object.entries(accountingProcessors)) {
  processors.set(jobName, processor);
}

// Register deal processors
for (const [jobName, processor] of Object.entries(dealProcessors)) {
  processors.set(jobName, processor);
}

// Register merchant processors
for (const [jobName, processor] of Object.entries(merchantProcessors)) {
  processors.set(jobName, processor);
}

// Register team processors
for (const [jobName, processor] of Object.entries(teamProcessors)) {
  processors.set(jobName, processor);
}

// Register disclosure processors
for (const [jobName, processor] of Object.entries(disclosureProcessors)) {
  processors.set(jobName, processor);
}

// Register collections processors
for (const [jobName, processor] of Object.entries(collectionsProcessors)) {
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
