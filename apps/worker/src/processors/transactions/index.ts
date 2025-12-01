import { ExportTransactionsProcessor } from "./export";
import { ProcessTransactionAttachmentProcessor } from "./process-attachment";
import { ProcessExportProcessor } from "./process-export";

/**
 * Export all transaction processors (for type imports)
 */
export { ExportTransactionsProcessor } from "./export";
export { ProcessExportProcessor } from "./process-export";
export { ProcessTransactionAttachmentProcessor } from "./process-attachment";

/**
 * Transaction processor registry
 * Maps job names to processor instances
 * Job names are derived from class names: ExportTransactionsProcessor -> export-transactions
 */
export const transactionProcessors = {
  "export-transactions": new ExportTransactionsProcessor(),
  "process-export": new ProcessExportProcessor(),
  "process-transaction-attachment": new ProcessTransactionAttachmentProcessor(),
};
