import { z } from "zod";

// Document processing schemas
export const processAttachmentSchema = z.object({
  transactionId: z.string().uuid(),
  mimetype: z.string(),
  filePath: z.array(z.string()),
  teamId: z.string().uuid(),
});

export const processInboxSchema = z.object({
  inboxId: z.string().uuid(),
  teamId: z.string().uuid(),
  mimetype: z.string(),
  filePath: z.array(z.string()),
});

export const processDocumentSchema = z.object({
  mimetype: z.string(),
  filePath: z.array(z.string()),
  teamId: z.string().uuid(),
});

export const convertHeicSchema = z.object({
  filePath: z.array(z.string()),
});

export const classifyDocumentSchema = z.object({
  content: z.string(),
  fileName: z.string(),
  teamId: z.string().uuid(),
});

export const classifyImageSchema = z.object({
  fileName: z.string(),
  teamId: z.string().uuid(),
});

export const embedDocumentTagsSchema = z.object({
  fileName: z.string(),
  teamId: z.string().uuid(),
});

// Onboarding schemas
export const onboardTeamSchema = z.object({
  userId: z.string().uuid(),
});

// Email schemas
export const welcomeEmailSchema = z.object({
  userId: z.string(),
  email: z.string(),
  fullName: z.string(),
  teamId: z.string(),
});

export const getStartedEmailSchema = z.object({
  userId: z.string(),
  email: z.string(),
  fullName: z.string(),
  teamId: z.string(),
});

export const trialExpiringEmailSchema = z.object({
  userId: z.string(),
  email: z.string(),
  fullName: z.string(),
  teamId: z.string(),
});

export const trialEndedEmailSchema = z.object({
  userId: z.string(),
  email: z.string(),
  fullName: z.string(),
  teamId: z.string(),
});

// Invoice schemas
export const generateInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  deliveryType: z.enum(["create", "create_and_send"]),
});

export const sendInvoiceEmailSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const sendInvoiceReminderSchema = z.object({
  invoiceId: z.string().uuid(),
});

// Export schemas
export const exportTransactionsSchema = z.object({
  teamId: z.string().uuid(),
  locale: z.string(),
  dateFormat: z.string().nullable().optional(),
  transactionIds: z.array(z.string().uuid()),
});

// Team schemas
export const deleteTeamJobSchema = z.object({
  teamId: z.string().uuid(),
  connections: z.array(
    z.object({
      provider: z.string(),
      referenceId: z.string().nullable(),
      accessToken: z.string().nullable(),
    }),
  ),
});

export const inviteTeamMembersJobSchema = z.object({
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

// Currency schemas
export const updateAccountBaseCurrencySchema = z.object({
  accountId: z.string().uuid(),
  teamId: z.string().uuid(),
  currency: z.string().min(3).max(3),
  balance: z.number(),
  baseCurrency: z.string().min(3).max(3),
});

export const updateBaseCurrencySchema = z.object({
  teamId: z.string().uuid(),
  baseCurrency: z.string().min(3).max(3),
});
