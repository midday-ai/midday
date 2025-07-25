import { scheduleInvoiceJobSchema } from "@jobs/schema";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { sendScheduledInvoice } from "./send-scheduled-invoice";

export const scheduleInvoiceJob = schemaTask({
  id: "schedule-invoice-job",
  schema: scheduleInvoiceJobSchema,
  maxDuration: 30,
  queue: {
    concurrencyLimit: 50,
  },
  run: async (payload) => {
    const { invoiceId, scheduledAt } = payload;
    const supabase = createClient();

    try {
      // Trigger the scheduled job with the specific datetime
      const scheduledRun = await sendScheduledInvoice.trigger(
        {
          invoiceId,
          scheduledAt,
        },
        {
          delay: scheduledAt,
        },
      );

      // Update the invoice with scheduling information
      await supabase
        .from("invoices")
        .update({
          status: "scheduled",
          scheduled_at: scheduledAt,
          scheduled_job_id: scheduledRun.id,
        })
        .eq("id", invoiceId);

      logger.info("Invoice scheduled successfully", {
        invoiceId,
        scheduledAt,
        scheduleId: scheduledRun.id,
      });

      return { scheduleId: scheduledRun.id };
    } catch (error) {
      logger.error("Failed to schedule invoice", {
        invoiceId,
        scheduledAt,
        error,
      });
      throw error;
    }
  },
});
