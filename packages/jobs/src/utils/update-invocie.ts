import { getDb } from "@jobs/init";
import { sendInvoiceNotifications } from "@jobs/tasks/invoice/notifications/send-notifications";
import { updateInvoice } from "@midday/db/queries";
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
  const db = getDb();

  const updatedInvoice = await updateInvoice(db, {
    id: invoiceId,
    // No teamId needed in trusted job context
    status,
    paidAt: paid_at,
  });

  if (
    !updatedInvoice?.invoiceNumber ||
    !updatedInvoice?.teamId ||
    !updatedInvoice?.customerName
  ) {
    logger.error("Invoice data is missing");
    return;
  }

  logger.info(`Invoice status changed to ${status}`);

  await sendInvoiceNotifications.trigger({
    invoiceId,
    invoiceNumber: updatedInvoice.invoiceNumber,
    status: updatedInvoice.status as "paid" | "overdue",
    teamId: updatedInvoice.teamId,
    customerName: updatedInvoice.customerName,
  });
}
