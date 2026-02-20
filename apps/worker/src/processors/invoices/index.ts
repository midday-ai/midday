import { GenerateInvoiceProcessor } from "./generate-invoice";
import { InvoiceRecurringSchedulerProcessor } from "./generate-recurring";
import { RegisterSupplierProcessor } from "./register-supplier";
import { ScheduleInvoiceProcessor } from "./schedule-invoice";
import { SendInvoiceEmailProcessor } from "./send-invoice-email";
import { SendInvoiceReminderProcessor } from "./send-invoice-reminder";
import { SubmitEInvoiceProcessor } from "./submit-e-invoice";
import { InvoiceUpcomingNotificationProcessor } from "./upcoming-notification";

/**
 * Export all invoice processors (for type imports)
 */
export { GenerateInvoiceProcessor } from "./generate-invoice";
export { InvoiceRecurringSchedulerProcessor } from "./generate-recurring";
export { RegisterSupplierProcessor } from "./register-supplier";
export { ScheduleInvoiceProcessor } from "./schedule-invoice";
export { SendInvoiceEmailProcessor } from "./send-invoice-email";
export { SendInvoiceReminderProcessor } from "./send-invoice-reminder";
export { SubmitEInvoiceProcessor } from "./submit-e-invoice";
export { InvoiceUpcomingNotificationProcessor } from "./upcoming-notification";

/**
 * Invoice processor registry
 * Maps job names to processor instances
 */
export const invoiceProcessors = {
  "invoice-recurring-scheduler": new InvoiceRecurringSchedulerProcessor(),
  "invoice-upcoming-notification": new InvoiceUpcomingNotificationProcessor(),
  "generate-invoice": new GenerateInvoiceProcessor(),
  "send-invoice-email": new SendInvoiceEmailProcessor(),
  "send-invoice-reminder": new SendInvoiceReminderProcessor(),
  "schedule-invoice": new ScheduleInvoiceProcessor(),
  "submit-e-invoice": new SubmitEInvoiceProcessor(),
  "register-supplier": new RegisterSupplierProcessor(),
};
