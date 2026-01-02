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
