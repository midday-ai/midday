import { createClient } from "@midday/supabase/job";
import { logger } from "@trigger.dev/sdk/v3";
import { sendInvoiceNotifications } from "../invoice/notifications/send-notifications";

export async function updateInvoiceStatus({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: "overdue" | "paid";
}): Promise<void> {
  const supabase = createClient();

  const { data: updatedInvoice } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", invoiceId)
    .select("id, invoice_number, status, team_id, customer_name")
    .single();

  if (
    !updatedInvoice?.invoice_number ||
    !updatedInvoice?.team_id ||
    !updatedInvoice?.customer_name
  ) {
    logger.error("Invoice data is missing");
    return;
  }

  logger.info(`Invoice status changed to ${status}`);

  await sendInvoiceNotifications.trigger({
    invoiceId,
    invoiceNumber: updatedInvoice.invoice_number,
    status: updatedInvoice.status as "paid" | "overdue",
    teamId: updatedInvoice.team_id,
    customerName: updatedInvoice.customer_name,
  });
}
