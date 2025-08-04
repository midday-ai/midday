import { z } from "zod";

export const sendInvoiceReminderSchema = z.object({
  invoiceId: z.string().uuid(),
});

export type SendInvoiceReminderPayload = z.infer<
  typeof sendInvoiceReminderSchema
>;

export const generateInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  deliveryType: z.enum(["create", "create_and_send", "scheduled"]),
});

export type GenerateInvoicePayload = z.infer<typeof generateInvoiceSchema>;

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

export const updateBaseCurrencySchema = z.object({
  teamId: z.string().uuid(),
  baseCurrency: z.string(),
});

export type UpdateBaseCurrencyPayload = z.infer<
  typeof updateBaseCurrencySchema
>;

export const exportTransactionsSchema = z.object({
  teamId: z.string().uuid(),
  locale: z.string(),
  dateFormat: z.string().nullable().optional(),
  transactionIds: z.array(z.string().uuid()),
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

export const inboxSlackUploadSchema = z.object({
  teamId: z.string(),
  token: z.string(),
  channelId: z.string(),
  threadId: z.string().optional(),
  file: z.object({
    id: z.string(),
    name: z.string(),
    mimetype: z.string(),
    size: z.number(),
    url: z.string(),
  }),
});

export type InboxSlackUploadPayload = z.infer<typeof inboxSlackUploadSchema>;

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

export const scheduleInvoiceJobSchema = z.object({
  invoiceId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
});

export type ScheduleInvoiceJobPayload = z.infer<
  typeof scheduleInvoiceJobSchema
>;
