import { createClient } from "@midday/supabase/job";
import { logger } from "@trigger.dev/sdk/v3";
import { invoiceNotification } from "jobs/invoice/notification";

export async function updateInvoiceStatus({
  invoiceId,
  customerName,
  status,
}: {
  invoiceId: string;
  customerName: string;
  status: "overdue" | "paid";
}): Promise<void> {
  const supabase = createClient();

  const { data: updatedInvoice } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", invoiceId)
    .select("id, invoice_number, status, team_id")
    .single();

  if (updatedInvoice) {
    logger.info(`Invoice status changed to ${status}`);

    await invoiceNotification.trigger({
      invoiceId,
      invoiceNumber: updatedInvoice.invoice_number,
      status: updatedInvoice.status,
      teamId: updatedInvoice.team_id,
      customerName,
    });
  }
}
