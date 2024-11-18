import { createClient } from "@midday/supabase/job";
import { logger, schedules } from "@trigger.dev/sdk/v3";
import { checkInvoiceStatus } from "./check-status";

export const invoiceScheduler = schedules.task({
  id: "invoice-scheduler",
  cron: "0 0,12 * * *", // Runs twice per day at 00:00 and 12:00 (UTC timezone)
  run: async () => {
    const supabase = createClient();

    const { data: invoices } = await supabase
      .from("invoices")
      .select("id")
      .in("status", ["unpaid", "overdue"]);

    if (!invoices) return;

    // Split invoices into chunks of 100
    for (let i = 0; i < invoices.length; i += 100) {
      const chunk = invoices.slice(i, i + 100);
      await checkInvoiceStatus.batchTrigger(
        chunk.map((invoice) => ({
          payload: {
            invoiceId: invoice.id,
          },
        })),
      );
    }

    logger.info("Invoice status check jobs started", {
      count: invoices.length,
    });
  },
});
