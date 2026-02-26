import { z } from "zod";

/**
 * Deal notification job schemas
 * Handles all deal notification types through a single combined job
 */

export const dealNotificationSchema = z.object({
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
  dealId: z.string().uuid(),
  dealNumber: z.string(),
  teamId: z.string().uuid(),
  merchantName: z.string().optional(),
  paidAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  refundedAt: z.string().optional(),
  // Recurring deal specific fields
  recurringId: z.string().uuid().optional(),
  recurringSequence: z.number().optional(),
  recurringTotalCount: z.number().optional(),
});

export type DealNotificationPayload = z.infer<
  typeof dealNotificationSchema
>;

/**
 * Deal recurring scheduler job schema
 * This is a scheduled job that runs periodically to generate recurring deals
 */
export const dealRecurringSchedulerSchema = z.object({});

export type DealRecurringSchedulerPayload = z.infer<
  typeof dealRecurringSchedulerSchema
>;

/**
 * Generate deal job schema
 * Handles PDF generation and optionally sending the deal
 */
export const generateDealSchema = z.object({
  dealId: z.string().uuid(),
  deliveryType: z.enum(["create", "create_and_send"]),
});

export type GenerateDealPayload = z.infer<typeof generateDealSchema>;

/**
 * Send deal email job schema
 * Handles sending the deal email with optional PDF attachment
 */
export const sendDealEmailSchema = z.object({
  dealId: z.string().uuid(),
  filename: z.string(),
  fullPath: z.string(),
});

export type SendDealEmailPayload = z.infer<typeof sendDealEmailSchema>;

/**
 * Send deal reminder job schema
 * Handles sending reminder emails for unpaid/overdue deals
 */
export const sendDealReminderSchema = z.object({
  dealId: z.string().uuid(),
});

export type SendDealReminderPayload = z.infer<
  typeof sendDealReminderSchema
>;

/**
 * Schedule deal job schema
 * Handles executing scheduled deals when their scheduled time arrives
 */
export const scheduleDealSchema = z.object({
  dealId: z.string().uuid(),
});

export type ScheduleDealPayload = z.infer<typeof scheduleDealSchema>;

/**
 * Deal upcoming notification job schema
 * This is a scheduled job that runs periodically to send notifications
 * about upcoming recurring deals (24 hours before generation)
 */
export const dealUpcomingNotificationSchema = z.object({});

export type DealUpcomingNotificationPayload = z.infer<
  typeof dealUpcomingNotificationSchema
>;
