import { sendInvoiceNotifications } from "@jobs/tasks/invoice/notifications/send-notifications";
import { createClient } from "@midday/supabase/job";
import { logger } from "@trigger.dev/sdk";

export async function updateInvoiceStatus({
  invoiceId,
  status,
  paid_at,
}: {
  invoiceId: string;
  status: "overdue" | "paid";
  paid_at?: string;
}): Promise<void> {
  const supabase = createClient();

  const { data: updatedInvoice } = await supabase
    .from("invoices")
    .update({ status, paid_at })
    .eq("id", invoiceId)
    .select("id, invoice_number, status, team_id, merchant_name")
    .single();

  if (
    !updatedInvoice?.invoice_number ||
    !updatedInvoice?.team_id ||
    !updatedInvoice?.merchant_name
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
    merchantName: updatedInvoice.merchant_name,
  });
}
