import { triggerJob } from "@midday/job-client";
import type {
  BatchProcessMatchingPayload,
  EmbedInboxPayload,
  InboxProviderInitialSetupPayload,
  InboxProviderSyncAccountPayload,
  ProcessAttachmentPayload,
  SlackUploadPayload,
} from "../schemas/inbox";
import type { ProcessTransactionAttachmentPayload } from "../schemas/transactions";

/**
 * Enqueue inbox job utilities
 * These functions provide type-safe ways to enqueue inbox jobs
 */

export async function enqueueProcessAttachment(
  payload: ProcessAttachmentPayload,
) {
  return triggerJob("process-attachment", payload, "inbox");
}

export async function enqueueSlackUpload(payload: SlackUploadPayload) {
  return triggerJob("slack-upload", payload, "inbox");
}

export async function enqueueEmbedInbox(payload: EmbedInboxPayload) {
  return triggerJob("embed-inbox", payload, "embeddings");
}

export async function enqueueBatchProcessMatching(
  payload: BatchProcessMatchingPayload,
) {
  return triggerJob("batch-process-matching", payload, "inbox");
}

export async function enqueueInitialSetup(
  payload: InboxProviderInitialSetupPayload,
) {
  return triggerJob("initial-setup", payload, "inbox-provider");
}

export async function enqueueSyncScheduler(
  payload: InboxProviderSyncAccountPayload,
) {
  return triggerJob("sync-scheduler", payload, "inbox-provider");
}

export async function enqueueProcessTransactionAttachment(
  payload: ProcessTransactionAttachmentPayload,
) {
  return triggerJob("process-transaction-attachment", payload, "transactions");
}
