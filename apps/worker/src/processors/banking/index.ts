import { BankSyncSchedulerProcessor } from "./bank-sync-scheduler";
import { DeleteConnectionProcessor } from "./delete-connection";
import { InitialBankSetupProcessor } from "./initial-bank-setup";
import { ReconnectConnectionProcessor } from "./reconnect-connection";
import { SyncAccountProcessor } from "./sync-account";
import { SyncConnectionProcessor } from "./sync-connection";
import { TransactionNotificationsProcessor } from "./transaction-notifications";
import { UpsertTransactionsProcessor } from "./upsert-transactions";

/**
 * Export all banking processors (for type imports)
 */
export { BankSyncSchedulerProcessor } from "./bank-sync-scheduler";
export { DeleteConnectionProcessor } from "./delete-connection";
export { InitialBankSetupProcessor } from "./initial-bank-setup";
export { ReconnectConnectionProcessor } from "./reconnect-connection";
export { SyncAccountProcessor } from "./sync-account";
export { SyncConnectionProcessor } from "./sync-connection";
export { TransactionNotificationsProcessor } from "./transaction-notifications";
export { UpsertTransactionsProcessor } from "./upsert-transactions";

/**
 * Banking processor registry
 * Maps job names to processor instances
 */
export const bankingProcessors = {
  "sync-connection": new SyncConnectionProcessor(),
  "sync-account": new SyncAccountProcessor(),
  "upsert-transactions": new UpsertTransactionsProcessor(),
  "initial-bank-setup": new InitialBankSetupProcessor(),
  "bank-sync-scheduler": new BankSyncSchedulerProcessor(),
  "delete-connection": new DeleteConnectionProcessor(),
  "reconnect-connection": new ReconnectConnectionProcessor(),
  "transaction-notifications": new TransactionNotificationsProcessor(),
};
