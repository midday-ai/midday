import { createClient } from "@midday/supabase/job";
import { logger, schedules } from "@trigger.dev/sdk/v3";
import { triggerBatch } from "jobs/utils/trigger-batch";
import { checkInvoiceStatus } from "../operations/check-status";

export const invoiceScheduler = schedules.task({
  id: "invoice-scheduler",
  cron: "0 0,12 * * *",
  run: async () => {
    const supabase = createClient();

    const { data: invoices } = await supabase
      .from("invoices")
      .select("id")
      .in("status", ["unpaid", "overdue"]);

    if (!invoices) return;

    const formattedInvoices = invoices.map((invoice) => ({
      invoiceId: invoice.id,
    }));

    await triggerBatch(formattedInvoices, checkInvoiceStatus);

    logger.info("Invoice status check jobs started", {
      count: invoices.length,
    });
  },
});
