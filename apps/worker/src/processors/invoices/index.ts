import { GenerateInvoiceProcessor } from "./generate-invoice";
import { InvoiceRecurringSchedulerProcessor } from "./generate-recurring";
import { InvoiceNotificationProcessor } from "./invoice-notification";
import { SendInvoiceEmailProcessor } from "./send-invoice-email";

/**
 * Export all invoice processors (for type imports)
 */
export { GenerateInvoiceProcessor } from "./generate-invoice";
export { InvoiceRecurringSchedulerProcessor } from "./generate-recurring";
export { InvoiceNotificationProcessor } from "./invoice-notification";
export { SendInvoiceEmailProcessor } from "./send-invoice-email";

/**
 * Invoice processor registry
 * Maps job names to processor instances
 */
export const invoiceProcessors = {
  "invoice-notification": new InvoiceNotificationProcessor(),
  "invoice-recurring-scheduler": new InvoiceRecurringSchedulerProcessor(),
  "generate-invoice": new GenerateInvoiceProcessor(),
  "send-invoice-email": new SendInvoiceEmailProcessor(),
};
