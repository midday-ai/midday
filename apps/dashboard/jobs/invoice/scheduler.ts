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

    await checkInvoiceStatus.batchTrigger(
      invoices.map((invoice) => ({
        payload: {
          invoiceId: invoice.id,
        },
      })),
    );

    logger.info("Invoice status check jobs started", {
      count: invoices.length,
    });
  },
});
