import {
  documentProcessedSchema,
  documentUploadedSchema,
  inboxAutoMatchedSchema,
  inboxCrossCurrencyMatchedSchema,
  inboxNeedsReviewSchema,
  inboxNewSchema,
  dealCancelledSchema,
  dealCreatedSchema,
  dealOverdueSchema,
  dealPaidSchema,
  dealReminderSentSchema,
  dealScheduledSchema,
  dealSentSchema,
  transactionsCreatedSchema,
  transactionsExportedSchema,
} from "@midday/notifications";
import { z } from "zod";

export const sendDealReminderSchema = z.object({
  dealId: z.string().uuid(),
});

export type SendDealReminderPayload = z.infer<
  typeof sendDealReminderSchema
>;

export const generateDealSchema = z.object({
  dealId: z.string().uuid(),
  deliveryType: z.enum(["create", "create_and_send", "scheduled"]),
});

export type GenerateDealPayload = z.infer<typeof generateDealSchema>;

export const deleteConnectionSchema = z.object({
  referenceId: z.string().optional().nullable(),
  provider: z.enum(["gocardless", "teller", "plaid", "enablebanking"]),
  accessToken: z.string().optional().nullable(),
});

export type DeleteConnectionPayload = z.infer<typeof deleteConnectionSchema>;

export const initialBankSetupSchema = z.object({
  teamId: z.string().uuid(),
  connectionId: z.string().uuid(),
});

export type InitialBankSetupPayload = z.infer<typeof initialBankSetupSchema>;

export const processDocumentSchema = z.object({
  mimetype: z.string(),
  filePath: z.array(z.string()),
  teamId: z.string(),
});

export type ProcessDocumentPayload = z.infer<typeof processDocumentSchema>;

export const processAttachmentSchema = z.object({
  teamId: z.string().uuid(),
  mimetype: z.string(),
  size: z.number(),
  filePath: z.array(z.string()),
  referenceId: z.string().optional(),
  website: z.string().optional(),
  // Use string instead of email() because Microsoft Graph can return
  // non-standard email formats (e.g., external users with #EXT#)
  senderEmail: z.string().optional(),
  inboxAccountId: z.string().uuid().optional(),
});

export type ProcessAttachmentPayload = z.infer<typeof processAttachmentSchema>;

export const deleteTeamSchema = z.object({
  teamId: z.string().uuid(),
  connections: z.array(
    z.object({
      provider: z.string(),
      referenceId: z.string().nullable(),
      accessToken: z.string().nullable(),
    }),
  ),
});

export type DeleteTeamPayload = z.infer<typeof deleteTeamSchema>;

export const inviteTeamMembersSchema = z.object({
  teamId: z.string().uuid(),
  ip: z.string(),
  locale: z.string(),
  invites: z.array(
    z.object({
      email: z.string().email(),
      invitedByName: z.string(),
      invitedByEmail: z.string().email(),
      teamName: z.string(),
    }),
  ),
});

export type InviteTeamMembersPayload = z.infer<typeof inviteTeamMembersSchema>;

export const inviteMerchantToPortalSchema = z.object({
  email: z.string().email(),
  inviterName: z.string(),
  teamName: z.string(),
  teamLogoUrl: z.string().optional().nullable(),
  merchantName: z.string(),
  inviteCode: z.string(),
});

export type InviteMerchantToPortalPayload = z.infer<
  typeof inviteMerchantToPortalSchema
>;

export const updateBaseCurrencySchema = z.object({
  teamId: z.string().uuid(),
  baseCurrency: z.string(),
});

export type UpdateBaseCurrencyPayload = z.infer<
  typeof updateBaseCurrencySchema
>;

export const exportTransactionsSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  locale: z.string(),
  dateFormat: z.string().nullable().optional(),
  transactionIds: z.array(z.string().uuid()),
  exportSettings: z
    .object({
      csvDelimiter: z.string(),
      includeCSV: z.boolean(),
      includeXLSX: z.boolean(),
      sendEmail: z.boolean(),
      accountantEmail: z.string().optional(),
    })
    .optional(),
});

export type ExportTransactionsPayload = z.infer<
  typeof exportTransactionsSchema
>;

export const importTransactionsSchema = z.object({
  inverted: z.boolean(),
  filePath: z.array(z.string()).optional(),
  bankAccountId: z.string(),
  currency: z.string(),
  teamId: z.string(),
  table: z.array(z.record(z.string(), z.string())).optional(),
  mappings: z.object({
    amount: z.string(),
    date: z.string(),
    description: z.string(),
    balance: z.string().optional(),
  }),
});

export type ImportTransactionsPayload = z.infer<
  typeof importTransactionsSchema
>;

export const syncConnectionSchema = z.object({
  connectionId: z.string().uuid(),
  manualSync: z.boolean().optional(),
});

export type SyncConnectionPayload = z.infer<typeof syncConnectionSchema>;

export const reconnectConnectionSchema = z.object({
  teamId: z.string().uuid(),
  connectionId: z.string().uuid(),
  provider: z.string(),
});

export type ReconnectConnectionPayload = z.infer<
  typeof reconnectConnectionSchema
>;

export const initialInboxSetupSchema = z.object({
  id: z.string().uuid(), // This is the inbox_account row id
});

export type InitialInboxSetupPayload = z.infer<typeof initialInboxSetupSchema>;

export const onboardTeamSchema = z.object({
  userId: z.string().uuid(),
});

export type OnboardTeamPayload = z.infer<typeof onboardTeamSchema>;

export const processTransactionAttachmentSchema = z.object({
  transactionId: z.string(),
  mimetype: z.string(),
  filePath: z.array(z.string()),
  teamId: z.string().uuid(),
});

export type ProcessTransactionAttachmentPayload = z.infer<
  typeof processTransactionAttachmentSchema
>;

export const embedTransactionSchema = z.object({
  transactionIds: z.array(z.string().uuid()),
  teamId: z.string().uuid(),
});

export type EmbedTransactionPayload = z.infer<typeof embedTransactionSchema>;

export const scheduleDealJobSchema = z.object({
  dealId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
});

export type ScheduleDealJobPayload = z.infer<
  typeof scheduleDealJobSchema
>;

const baseJobSchema = z.object({
  teamId: z.string().uuid(),
  sendEmail: z.boolean().optional().default(false),
});

export const notificationSchema = z.discriminatedUnion("type", [
  baseJobSchema
    .extend({
      type: z.literal("transactions_created"),
    })
    .extend(transactionsCreatedSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("inbox_new"),
    })
    .extend(inboxNewSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("deal_paid"),
    })
    .extend(dealPaidSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("deal_overdue"),
    })
    .extend(dealOverdueSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("deal_scheduled"),
    })
    .extend(dealScheduledSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("deal_sent"),
    })
    .extend(dealSentSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("deal_reminder_sent"),
    })
    .extend(dealReminderSentSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("deal_cancelled"),
    })
    .extend(dealCancelledSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("deal_created"),
    })
    .extend(dealCreatedSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("transactions_exported"),
    })
    .extend(transactionsExportedSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("document_uploaded"),
    })
    .extend(documentUploadedSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("document_processed"),
    })
    .extend(documentProcessedSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("inbox_auto_matched"),
    })
    .extend(inboxAutoMatchedSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("inbox_needs_review"),
    })
    .extend(inboxNeedsReviewSchema.omit({ users: true }).shape),

  baseJobSchema
    .extend({
      type: z.literal("inbox_cross_currency_matched"),
    })
    .extend(inboxCrossCurrencyMatchedSchema.omit({ users: true }).shape),
]);

export type NotificationPayload = z.infer<typeof notificationSchema>;
