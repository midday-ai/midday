import { BatchProcessMatchingProcessor } from "./batch-process-matching";
import { InitialSetupProcessor } from "./initial-setup";
import { MatchTransactionsBidirectionalProcessor } from "./match-transactions-bidirectional";
import { NoMatchSchedulerProcessor } from "./no-match-scheduler";
import { ProcessAttachmentProcessor } from "./process-attachment";
import { SlackUploadProcessor } from "./slack-upload";
import { SyncSchedulerProcessor } from "./sync-scheduler";
import { WhatsAppUploadProcessor } from "./whatsapp-upload";

/**
 * Export all inbox processors (for type imports)
 */
export { BatchProcessMatchingProcessor } from "./batch-process-matching";
export { InitialSetupProcessor } from "./initial-setup";
export { MatchTransactionsBidirectionalProcessor } from "./match-transactions-bidirectional";
export { NoMatchSchedulerProcessor } from "./no-match-scheduler";
export { ProcessAttachmentProcessor } from "./process-attachment";
export { SlackUploadProcessor } from "./slack-upload";
export { SyncSchedulerProcessor } from "./sync-scheduler";
export { WhatsAppUploadProcessor } from "./whatsapp-upload";

/**
 * Inbox processor registry
 * Maps job names to processor instances
 */
export const inboxProcessors = {
  "batch-process-matching": new BatchProcessMatchingProcessor(),
  "match-transactions-bidirectional":
    new MatchTransactionsBidirectionalProcessor(),
  "process-attachment": new ProcessAttachmentProcessor(),
  "slack-upload": new SlackUploadProcessor(),
  "whatsapp-upload": new WhatsAppUploadProcessor(),
  "no-match-scheduler": new NoMatchSchedulerProcessor(),
  "sync-scheduler": new SyncSchedulerProcessor(),
  "initial-setup": new InitialSetupProcessor(),
};
