import { EmbedTransactionProcessor } from "./embed-transaction";
import { EnrichTransactionProcessor } from "./enrich-transaction";
import { ExportTransactionsProcessor } from "./export";
import { ImportTransactionsProcessor } from "./import-transactions";
import { ProcessTransactionAttachmentProcessor } from "./process-attachment";
import { ProcessExportProcessor } from "./process-export";
import { UpdateAccountBaseCurrencyProcessor } from "./update-account-base-currency";
import { UpdateBaseCurrencyProcessor } from "./update-base-currency";

/**
 * Export all transaction processors (for type imports)
 */
export { EmbedTransactionProcessor } from "./embed-transaction";
export { EnrichTransactionProcessor } from "./enrich-transaction";
export { ExportTransactionsProcessor } from "./export";
export { ImportTransactionsProcessor } from "./import-transactions";
export { ProcessTransactionAttachmentProcessor } from "./process-attachment";
export { ProcessExportProcessor } from "./process-export";
export { UpdateAccountBaseCurrencyProcessor } from "./update-account-base-currency";
export { UpdateBaseCurrencyProcessor } from "./update-base-currency";

/**
 * Transaction processor registry
 * Maps job names to processor instances
 * Job names are derived from class names: ExportTransactionsProcessor -> export-transactions
 */
export const transactionProcessors = {
  "embed-transaction": new EmbedTransactionProcessor(),
  "enrich-transactions": new EnrichTransactionProcessor(),
  "export-transactions": new ExportTransactionsProcessor(),
  "import-transactions": new ImportTransactionsProcessor(),
  "process-export": new ProcessExportProcessor(),
  "process-transaction-attachment": new ProcessTransactionAttachmentProcessor(),
  "update-account-base-currency": new UpdateAccountBaseCurrencyProcessor(),
  "update-base-currency": new UpdateBaseCurrencyProcessor(),
};
