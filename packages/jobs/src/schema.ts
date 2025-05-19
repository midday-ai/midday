import { z } from "zod";

export const sendInvoiceReminderSchema = z.object({
  invoiceId: z.string().uuid(),
});

export type SendInvoiceReminderPayload = z.infer<
  typeof sendInvoiceReminderSchema
>;

export const generateInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  deliveryType: z.enum(["create", "create_and_send"]),
});

export type GenerateInvoicePayload = z.infer<typeof generateInvoiceSchema>;

export const deleteConnectionSchema = z.object({
  referenceId: z.string().optional().nullable(),
  provider: z.string(),
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
});

export type ProcessAttachmentPayload = z.infer<typeof processAttachmentSchema>;

export const deleteTeamSchema = z.object({
  teamId: z.string().uuid(),
  connections: z.array(
    z.object({
      provider: z.string().nullable(),
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
      inviteCode: z.string(),
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
