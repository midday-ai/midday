import { scheduleInvoiceJobSchema } from "@jobs/schema";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateInvoice } from "../operations/generate-invoice";

export const scheduleInvoiceJob = schemaTask({
  id: "schedule-invoice",
  schema: scheduleInvoiceJobSchema,
  maxDuration: 60,
  queue: {
    concurrencyLimit: 10,
  },
  run: async (payload) => {
    const { invoiceId } = payload;
    const supabase = createClient();

    // Get the invoice to verify it's still scheduled
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, status, scheduled_job_id")
      .eq("id", invoiceId)
      .single();

    if (!invoice) {
      logger.error("Invoice not found", { invoiceId });
      return;
    }

    if (invoice.status !== "scheduled") {
      logger.info("Invoice is no longer scheduled, skipping", {
        invoiceId,
        status: invoice.status,
      });
      return;
    }

    // Update invoice status to unpaid
    await supabase
      .from("invoices")
      .update({
        status: "unpaid",
      })
      .eq("id", invoiceId);

    // Generate and send the invoice
    await generateInvoice.trigger({
      invoiceId,
      deliveryType: "create_and_send",
    });

    logger.info("Scheduled invoice sent successfully", { invoiceId });
  },
});
