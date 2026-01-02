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
  ]),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  teamId: z.string().uuid(),
  customerName: z.string().optional(),
  paidAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  refundedAt: z.string().optional(),
});

export type InvoiceNotificationPayload = z.infer<
  typeof invoiceNotificationSchema
>;
