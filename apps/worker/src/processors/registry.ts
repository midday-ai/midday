import type { Job } from "bullmq";
import {
  BatchProcessMatchingProcessor,
  EmbedInboxProcessor,
  MatchTransactionsBidirectionalProcessor,
} from "./inbox";
import {
  ExportTransactionsProcessor,
  ProcessExportProcessor,
} from "./transactions";

/**
 * Processor registry - maps job names to processor instances
 */
const processors = new Map<
  string,
  { handle: (job: Job) => Promise<unknown> }
>();

// Register inbox processors
const embedInboxProcessor = new EmbedInboxProcessor();
processors.set("embed-inbox", embedInboxProcessor);

const batchProcessMatchingProcessor = new BatchProcessMatchingProcessor();
processors.set("batch-process-matching", batchProcessMatchingProcessor);

const matchTransactionsBidirectionalProcessor =
  new MatchTransactionsBidirectionalProcessor();
processors.set(
  "match-transactions-bidirectional",
  matchTransactionsBidirectionalProcessor,
);

// Register transaction processors
const exportTransactionsProcessor = new ExportTransactionsProcessor();
processors.set("export-transactions", exportTransactionsProcessor);

const processExportProcessor = new ProcessExportProcessor();
processors.set("process-export", processExportProcessor);

/**
 * Get processor for a job name
 */
export function getProcessor(jobName: string) {
  return processors.get(jobName);
}

/**
 * Check if a processor exists for a job name
 */
export function hasProcessor(jobName: string): boolean {
  return processors.has(jobName);
}
