import { ExportTransactionsProcessor } from "./export-transactions";
import { SyncAttachmentsProcessor } from "./sync-attachments";

// Re-export base class for extension
export { AccountingProcessorBase } from "./base";
export type {
  AccountingProviderId,
  InitializedProvider,
  TransactionForMapping,
} from "./base";

/**
 * Accounting processors - maps job names to processor instances
 * Note: Auto-sync has been removed in favor of manual export only
 */
export const accountingProcessors = {
  "sync-accounting-attachments": new SyncAttachmentsProcessor(),
  "export-to-accounting": new ExportTransactionsProcessor(),
};
