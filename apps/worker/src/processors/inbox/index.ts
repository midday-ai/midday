import { BatchProcessMatchingProcessor } from "./batch-process-matching";
import { EmbedInboxProcessor } from "./embed-inbox";
import { InitialSetupProcessor } from "./initial-setup";
import { MatchTransactionsBidirectionalProcessor } from "./match-transactions-bidirectional";
import { NoMatchSchedulerProcessor } from "./no-match-scheduler";
import { ProcessAttachmentProcessor } from "./process-attachment";
import { SlackUploadProcessor } from "./slack-upload";
import { SyncSchedulerProcessor } from "./sync-scheduler";

/**
 * Export all inbox processors (for type imports)
 */
export { EmbedInboxProcessor } from "./embed-inbox";
export { BatchProcessMatchingProcessor } from "./batch-process-matching";
export { MatchTransactionsBidirectionalProcessor } from "./match-transactions-bidirectional";
export { ProcessAttachmentProcessor } from "./process-attachment";
export { SlackUploadProcessor } from "./slack-upload";
export { NoMatchSchedulerProcessor } from "./no-match-scheduler";
export { SyncSchedulerProcessor } from "./sync-scheduler";
export { InitialSetupProcessor } from "./initial-setup";

/**
 * Inbox processor registry
 * Maps job names to processor instances
 * Job names are derived from class names: EmbedInboxProcessor -> embed-inbox
 */
export const inboxProcessors = {
  "embed-inbox": new EmbedInboxProcessor(),
  "batch-process-matching": new BatchProcessMatchingProcessor(),
  "match-transactions-bidirectional":
    new MatchTransactionsBidirectionalProcessor(),
  "process-attachment": new ProcessAttachmentProcessor(),
  "slack-upload": new SlackUploadProcessor(),
  "no-match-scheduler": new NoMatchSchedulerProcessor(),
  "sync-scheduler": new SyncSchedulerProcessor(),
  "initial-setup": new InitialSetupProcessor(),
};
