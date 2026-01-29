import { z } from "zod";

/**
 * Invoice notification job schemas
 * Handles all invoice notification types through a single combined job
 */

export const invoiceNotificationSchema = z.object({
  type: z.enum([
    "paid",
    "overdue",
    "sent",
    "cancelled",
    "scheduled",
    "reminder_sent",
    "refunded",
    "recurring_generated",
    "recurring_series_completed",
    "recurring_series_paused",
  ]),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  teamId: z.string().uuid(),
  customerName: z.string().optional(),
  paidAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  refundedAt: z.string().optional(),
  // Recurring invoice specific fields
  recurringId: z.string().uuid().optional(),
  recurringSequence: z.number().optional(),
  recurringTotalCount: z.number().optional(),
});

export type InvoiceNotificationPayload = z.infer<
  typeof invoiceNotificationSchema
>;

/**
 * Invoice recurring scheduler job schema
 * This is a scheduled job that runs periodically to generate recurring invoices
 */
export const invoiceRecurringSchedulerSchema = z.object({});

export type InvoiceRecurringSchedulerPayload = z.infer<
  typeof invoiceRecurringSchedulerSchema
>;

/**
 * Generate invoice job schema
 * Handles PDF generation and optionally sending the invoice
 */
export const generateInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  deliveryType: z.enum(["create", "create_and_send"]),
});

export type GenerateInvoicePayload = z.infer<typeof generateInvoiceSchema>;

/**
 * Send invoice email job schema
 * Handles sending the invoice email with optional PDF attachment
 */
export const sendInvoiceEmailSchema = z.object({
  invoiceId: z.string().uuid(),
  filename: z.string(),
  fullPath: z.string(),
});

export type SendInvoiceEmailPayload = z.infer<typeof sendInvoiceEmailSchema>;

/**
 * Send invoice reminder job schema
 * Handles sending reminder emails for unpaid/overdue invoices
 */
export const sendInvoiceReminderSchema = z.object({
  invoiceId: z.string().uuid(),
});

export type SendInvoiceReminderPayload = z.infer<
  typeof sendInvoiceReminderSchema
>;

/**
 * Schedule invoice job schema
 * Handles executing scheduled invoices when their scheduled time arrives
 */
export const scheduleInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
});

export type ScheduleInvoicePayload = z.infer<typeof scheduleInvoiceSchema>;

/**
 * Invoice upcoming notification job schema
 * This is a scheduled job that runs periodically to send notifications
 * about upcoming recurring invoices (24 hours before generation)
 */
export const invoiceUpcomingNotificationSchema = z.object({});

export type InvoiceUpcomingNotificationPayload = z.infer<
  typeof invoiceUpcomingNotificationSchema
>;

/**
 * Check invoice status job schema
 * Checks if an invoice has been paid by matching with transactions
 */
export const checkInvoiceStatusSchema = z.object({
  invoiceId: z.string().uuid(),
});

export type CheckInvoiceStatusPayload = z.infer<
  typeof checkInvoiceStatusSchema
>;

/**
 * Invoice status scheduler schema
 * Scheduled job to check status of unpaid/overdue invoices
 */
export const invoiceStatusSchedulerSchema = z.object({});

export type InvoiceStatusSchedulerPayload = z.infer<
  typeof invoiceStatusSchedulerSchema
>;
