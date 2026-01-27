import { z } from "zod";

/**
 * Unified notification job schemas
 * Uses discriminated union on "type" field for type-safe handling
 * No casting required - TypeScript narrows types automatically in switch cases
 */

// Base fields shared by all notifications
const baseFields = {
  teamId: z.string().uuid(),
};

// ============================================
// Insight Notifications
// ============================================

export const insightReadyNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("insight_ready"),
  insightId: z.string(),
  periodType: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  periodLabel: z.string(),
  periodNumber: z.number(),
  periodYear: z.number(),
  title: z.string().optional(),
  audioUrl: z.string().optional(),
});

// ============================================
// Inbox Notifications
// ============================================

export const inboxNewNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("inbox_new"),
  totalCount: z.number(),
  inboxType: z.enum(["email", "sync", "slack", "upload"]),
  source: z.enum(["system", "user"]).default("system"),
  provider: z.string().optional(),
});

// ============================================
// Document Notifications
// ============================================

export const documentUploadedNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("document_uploaded"),
  fileName: z.string(),
  filePath: z.array(z.string()),
  mimeType: z.string(),
});

export const documentProcessedNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("document_processed"),
  fileName: z.string(),
  filePath: z.array(z.string()),
  mimeType: z.string(),
  contentLength: z.number().optional(),
  sampleLength: z.number().optional(),
});

// ============================================
// Invoice Notifications
// ============================================

export const invoicePaidNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("invoice_paid"),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerName: z.string().optional(),
  paidAt: z.string().optional(),
});

export const invoiceOverdueNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("invoice_overdue"),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerName: z.string().optional(),
});

export const invoiceSentNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("invoice_sent"),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerName: z.string().optional(),
});

export const invoiceCancelledNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("invoice_cancelled"),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerName: z.string().optional(),
});

export const invoiceScheduledNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("invoice_scheduled"),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  scheduledAt: z.string(),
  customerName: z.string().optional(),
});

export const invoiceReminderSentNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("invoice_reminder_sent"),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerName: z.string().optional(),
});

export const invoiceRefundedNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("invoice_refunded"),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerName: z.string().optional(),
  refundedAt: z.string().optional(),
});

export const invoiceRecurringGeneratedNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("invoice_recurring_generated"),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerName: z.string().optional(),
  recurringId: z.string().uuid().optional(),
  recurringSequence: z.number().optional(),
  recurringTotalCount: z.number().optional(),
});

export const recurringSeriesCompletedNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("recurring_series_completed"),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerName: z.string().optional(),
  recurringId: z.string().uuid(),
  totalGenerated: z.number(),
});

export const recurringSeriesPausedNotificationSchema = z.object({
  ...baseFields,
  type: z.literal("recurring_series_paused"),
  recurringId: z.string().uuid(),
  customerName: z.string().optional(),
});

// ============================================
// Discriminated Union of All Notification Types
// ============================================

export const notificationPayloadSchema = z.discriminatedUnion("type", [
  // Insights
  insightReadyNotificationSchema,
  // Inbox
  inboxNewNotificationSchema,
  // Documents
  documentUploadedNotificationSchema,
  documentProcessedNotificationSchema,
  // Invoices
  invoicePaidNotificationSchema,
  invoiceOverdueNotificationSchema,
  invoiceSentNotificationSchema,
  invoiceCancelledNotificationSchema,
  invoiceScheduledNotificationSchema,
  invoiceReminderSentNotificationSchema,
  invoiceRefundedNotificationSchema,
  invoiceRecurringGeneratedNotificationSchema,
  recurringSeriesCompletedNotificationSchema,
  recurringSeriesPausedNotificationSchema,
]);

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

// Individual type exports for type narrowing
export type InsightReadyNotification = z.infer<
  typeof insightReadyNotificationSchema
>;
export type InboxNewNotification = z.infer<typeof inboxNewNotificationSchema>;
export type DocumentUploadedNotification = z.infer<
  typeof documentUploadedNotificationSchema
>;
export type DocumentProcessedNotification = z.infer<
  typeof documentProcessedNotificationSchema
>;
export type InvoicePaidNotification = z.infer<
  typeof invoicePaidNotificationSchema
>;
export type InvoiceOverdueNotification = z.infer<
  typeof invoiceOverdueNotificationSchema
>;
export type InvoiceSentNotification = z.infer<
  typeof invoiceSentNotificationSchema
>;
export type InvoiceCancelledNotification = z.infer<
  typeof invoiceCancelledNotificationSchema
>;
export type InvoiceScheduledNotification = z.infer<
  typeof invoiceScheduledNotificationSchema
>;
export type InvoiceReminderSentNotification = z.infer<
  typeof invoiceReminderSentNotificationSchema
>;
export type InvoiceRefundedNotification = z.infer<
  typeof invoiceRefundedNotificationSchema
>;
export type InvoiceRecurringGeneratedNotification = z.infer<
  typeof invoiceRecurringGeneratedNotificationSchema
>;
export type RecurringSeriesCompletedNotification = z.infer<
  typeof recurringSeriesCompletedNotificationSchema
>;
export type RecurringSeriesPausedNotification = z.infer<
  typeof recurringSeriesPausedNotificationSchema
>;
