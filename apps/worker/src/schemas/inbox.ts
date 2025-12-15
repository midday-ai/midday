import { z } from "zod";

/**
 * Inbox job schemas (independent from @midday/jobs)
 */

export const embedInboxSchema = z.object({
  inboxId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export type EmbedInboxPayload = z.infer<typeof embedInboxSchema>;

export const batchProcessMatchingSchema = z.object({
  teamId: z.string().uuid(),
  inboxIds: z.array(z.string().uuid()),
});

export type BatchProcessMatchingPayload = z.infer<
  typeof batchProcessMatchingSchema
>;

export const matchTransactionsBidirectionalSchema = z.object({
  teamId: z.string().uuid(),
  newTransactionIds: z.array(z.string().uuid()),
});

export type MatchTransactionsBidirectionalPayload = z.infer<
  typeof matchTransactionsBidirectionalSchema
>;

export const processAttachmentSchema = z.object({
  teamId: z.string().uuid(),
  mimetype: z.string(),
  size: z.number(),
  filePath: z.array(z.string()),
  referenceId: z.string().optional(),
  website: z.string().optional(),
  senderEmail: z.string().email().optional(),
  inboxAccountId: z.string().uuid().optional(),
});

export type ProcessAttachmentPayload = z.infer<typeof processAttachmentSchema>;

export const noMatchSchedulerSchema = z.object({
  // Empty payload - scheduler runs globally
});

export type NoMatchSchedulerPayload = z.infer<typeof noMatchSchedulerSchema>;

export const slackUploadSchema = z.object({
  teamId: z.string(),
  token: z.string(),
  channelId: z.string(),
  threadId: z.string().optional(),
  messageTs: z.string().optional(), // Message timestamp for reactions
  file: z.object({
    id: z.string(),
    name: z.string(),
    mimetype: z.string(),
    size: z.number(),
    url: z.string(),
  }),
});

export type SlackUploadPayload = z.infer<typeof slackUploadSchema>;

export const whatsappUploadSchema = z.object({
  teamId: z.string().uuid(),
  phoneNumber: z.string(), // User's WhatsApp phone number
  messageId: z.string(), // WhatsApp message ID for reactions
  mediaId: z.string(), // Media ID from WhatsApp
  mimeType: z.string(),
  filename: z.string().optional(),
  caption: z.string().optional(),
});

export type WhatsAppUploadPayload = z.infer<typeof whatsappUploadSchema>;

// Provider schemas
export const inboxProviderInitialSetupSchema = z.object({
  inboxAccountId: z.string().uuid(),
});

export type InboxProviderInitialSetupPayload = z.infer<
  typeof inboxProviderInitialSetupSchema
>;

export const inboxProviderSyncAccountSchema = z.object({
  id: z.string().uuid(), // Inbox account ID
  manualSync: z.boolean().optional(),
});

export type InboxProviderSyncAccountPayload = z.infer<
  typeof inboxProviderSyncAccountSchema
>;
