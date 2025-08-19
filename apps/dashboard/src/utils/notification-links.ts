// Simple, maintainable notification link builder using recordId pattern

export interface NotificationLink {
  href: string;
  isExternal?: boolean;
}

type LinkBuilder = (
  recordId: string,
  metadata?: Record<string, any>,
) => NotificationLink;

// Clean, simple link builders - one per notification category
const linkBuilders: Record<string, LinkBuilder> = {
  // All invoice notifications go to invoice details
  invoice_paid: (recordId) => ({
    href: `/invoices?invoiceId=${recordId}&type=details`,
  }),
  invoice_overdue: (recordId) => ({
    href: `/invoices?invoiceId=${recordId}&type=details`,
  }),
  invoice_created: (recordId) => ({
    href: `/invoices?invoiceId=${recordId}&type=details`,
  }),
  invoice_sent: (recordId) => ({
    href: `/invoices?invoiceId=${recordId}&type=details`,
  }),
  invoice_scheduled: (recordId) => ({
    href: `/invoices?invoiceId=${recordId}&type=details`,
  }),
  invoice_reminder_sent: (recordId) => ({
    href: `/invoices?invoiceId=${recordId}&type=details`,
  }),
  invoice_cancelled: (recordId) => ({
    href: `/invoices?invoiceId=${recordId}&type=details`,
  }),

  // Transaction notifications
  transactions_created: (recordId, metadata) => {
    // Special case: use date range if available, otherwise specific transaction
    if (metadata?.from && metadata?.to) {
      return {
        href: `/transactions?start=${metadata.from}&end=${metadata.to}`,
      };
    }
    return { href: `/transactions?id=${recordId}` };
  },

  // Simple static links
  inbox_new: () => ({ href: "/inbox" }),

  // Transaction matching
  match: (recordId) => ({ href: `/transactions?id=${recordId}` }),

  // Future examples:
  // customer_created: (recordId) => ({ href: `/customers/${recordId}` }),
  // payment_failed: (recordId) => ({ href: `/payments/${recordId}` }),
  // project_updated: (recordId) => ({ href: `/projects/${recordId}` }),
};

export function getNotificationLink(
  activityType: string,
  recordId: string | null | undefined,
  metadata?: Record<string, any>,
): NotificationLink | null {
  const builder = linkBuilders[activityType];
  if (!builder) {
    console.warn(
      `No link builder found for notification type: ${activityType}`,
    );
    return null;
  }

  try {
    // Some notifications don't need recordId (like inbox_new)
    return builder(recordId || "", metadata);
  } catch (error) {
    console.error(`Error building link for ${activityType}:`, error);
    return null;
  }
}

export function isNotificationClickable(
  activityType: string,
  recordId: string | null | undefined,
  metadata?: Record<string, any>,
): boolean {
  return getNotificationLink(activityType, recordId, metadata) !== null;
}

// Registry for easy maintenance - shows all supported notification types
export const SUPPORTED_NOTIFICATION_TYPES = Object.keys(linkBuilders);
