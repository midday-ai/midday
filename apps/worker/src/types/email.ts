import { z } from "zod";

export const invoiceReminderSchema = z.object({
  type: z.literal("invoice_reminder"),
  recipientEmail: z.string().email(),
  templateData: z.object({
    invoiceId: z.string().uuid(),
    amount: z.number().positive(),
    dueDate: z.string(),
    customerName: z.string().optional(),
    invoiceNumber: z.string().optional(),
  }),
  teamId: z.string().uuid(),
});

export const teamInviteSchema = z.object({
  type: z.literal("team_invite"),
  recipientEmail: z.string().email(),
  templateData: z.object({
    inviteToken: z.string(),
    inviterName: z.string(),
    inviterEmail: z.string().email(),
    teamName: z.string(),
    role: z.enum(["admin", "member", "viewer"]).optional().default("member"),
    expiresAt: z.string().optional(),
    personalMessage: z.string().optional(),
  }),
  teamId: z.string().uuid(),
});

export const notificationSchema = z.object({
  type: z.literal("notification"),
  recipientEmail: z.string().email(),
  templateData: z.object({
    notificationType: z.enum([
      "transaction_imported",
      "bank_sync_completed",
      "invoice_paid",
      "monthly_report",
      "security_alert",
      "subscription_updated",
    ]),
    title: z.string(),
    message: z.string(),
    actionUrl: z.string().url().optional(),
    actionText: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
  teamId: z.string().uuid().optional(),
});

export const emailJobSchema = z.union([
  invoiceReminderSchema,
  teamInviteSchema,
  notificationSchema,
]);

export type InvoiceReminderData = z.infer<typeof invoiceReminderSchema>;
export type TeamInviteData = z.infer<typeof teamInviteSchema>;
export type NotificationData = z.infer<typeof notificationSchema>;
export type EmailJobData = z.infer<typeof emailJobSchema>;

export const EMAIL_JOB_PRIORITIES = {
  invoice_reminder: 5, // High priority - urgent business communications
  team_invite: 3, // Medium priority - important but not urgent
  notification: 1, // Low priority - informational
} as const;

export type EmailJobType = keyof typeof EMAIL_JOB_PRIORITIES;
