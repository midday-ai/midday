import { ExportTransactionsProcessor } from "./export-transactions";
import { AccountingSyncSchedulerProcessor } from "./sync-scheduler";
import { SyncAttachmentsProcessor } from "./sync-attachments";
import { SyncTransactionsProcessor } from "./sync-transactions";

// Re-export base class for extension
export { AccountingProcessorBase } from "./base";
export type { AccountingProviderId, InitializedProvider, TransactionForMapping } from "./base";

/**
 * Accounting processors - maps job names to processor instances
 */
export const accountingProcessors = {
  "accounting-sync-scheduler": new AccountingSyncSchedulerProcessor(),
  "sync-accounting-transactions": new SyncTransactionsProcessor(),
  "sync-accounting-attachments": new SyncAttachmentsProcessor(),
  "export-to-accounting": new ExportTransactionsProcessor(),
};

