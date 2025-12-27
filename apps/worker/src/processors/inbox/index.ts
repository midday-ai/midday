import { BatchProcessMatchingProcessor } from "./batch-process-matching";
import { InitialSetupProcessor } from "./initial-setup";
import { MatchTransactionsBidirectionalProcessor } from "./match-transactions-bidirectional";
import { NoMatchSchedulerProcessor } from "./no-match-scheduler";
import { ProcessAttachmentProcessor } from "./process-attachment";
import { SlackUploadProcessor } from "./slack-upload";
import { SyncSchedulerProcessor } from "./sync-scheduler";
import { TelegramUploadProcessor } from "./telegram-upload";
import { WhatsAppUploadProcessor } from "./whatsapp-upload";

/**
 * Export all inbox processors (for type imports)
 */
export { BatchProcessMatchingProcessor } from "./batch-process-matching";
export { MatchTransactionsBidirectionalProcessor } from "./match-transactions-bidirectional";
export { ProcessAttachmentProcessor } from "./process-attachment";
export { SlackUploadProcessor } from "./slack-upload";
export { TelegramUploadProcessor } from "./telegram-upload";
export { WhatsAppUploadProcessor } from "./whatsapp-upload";
export { NoMatchSchedulerProcessor } from "./no-match-scheduler";
export { SyncSchedulerProcessor } from "./sync-scheduler";
export { InitialSetupProcessor } from "./initial-setup";

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
  "telegram-upload": new TelegramUploadProcessor(),
  "whatsapp-upload": new WhatsAppUploadProcessor(),
  "no-match-scheduler": new NoMatchSchedulerProcessor(),
  "sync-scheduler": new SyncSchedulerProcessor(),
  "initial-setup": new InitialSetupProcessor(),
};
