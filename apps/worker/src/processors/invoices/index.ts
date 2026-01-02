import { InvoiceNotificationProcessor } from "./invoice-notification";

/**
 * Export all invoice processors (for type imports)
 */
export { InvoiceNotificationProcessor } from "./invoice-notification";

/**
 * Invoice processor registry
 * Maps job names to processor instances
 */
export const invoiceProcessors = {
  "invoice-notification": new InvoiceNotificationProcessor(),
};
