import { BatchEmbedInboxProcessor } from "./batch-embed-inbox";
import { BatchExtractInboxProcessor } from "./batch-extract-inbox";
import { BatchProcessMatchingProcessor } from "./batch-process-matching";
import { MatchTransactionsBidirectionalProcessor } from "./match-transactions-bidirectional";
import { NoMatchSchedulerProcessor } from "./no-match-scheduler";
import { ProcessAttachmentProcessor } from "./process-attachment";
import { SlackUploadProcessor } from "./slack-upload";
import { SyncAccountsSchedulerProcessor } from "./sync-accounts-scheduler";
import { SyncSchedulerProcessor } from "./sync-scheduler";
import { WhatsAppUploadProcessor } from "./whatsapp-upload";

export { BatchEmbedInboxProcessor } from "./batch-embed-inbox";
export { BatchExtractInboxProcessor } from "./batch-extract-inbox";
export { BatchProcessMatchingProcessor } from "./batch-process-matching";
export { MatchTransactionsBidirectionalProcessor } from "./match-transactions-bidirectional";
export { NoMatchSchedulerProcessor } from "./no-match-scheduler";
export { ProcessAttachmentProcessor } from "./process-attachment";
export { SlackUploadProcessor } from "./slack-upload";
export { SyncAccountsSchedulerProcessor } from "./sync-accounts-scheduler";
export { SyncSchedulerProcessor } from "./sync-scheduler";
export { WhatsAppUploadProcessor } from "./whatsapp-upload";

export const inboxProcessors = {
  "batch-embed-inbox": new BatchEmbedInboxProcessor(),
  "batch-extract-inbox": new BatchExtractInboxProcessor(),
  "batch-process-matching": new BatchProcessMatchingProcessor(),
  "match-transactions-bidirectional":
    new MatchTransactionsBidirectionalProcessor(),
  "process-attachment": new ProcessAttachmentProcessor(),
  "slack-upload": new SlackUploadProcessor(),
  "whatsapp-upload": new WhatsAppUploadProcessor(),
  "no-match-scheduler": new NoMatchSchedulerProcessor(),
  "sync-accounts-scheduler": new SyncAccountsSchedulerProcessor(),
  "sync-scheduler": new SyncSchedulerProcessor(),
};
