import { getDb } from "@jobs/init";
import { sendInvoiceNotifications } from "@jobs/tasks/invoice/notifications/send-notifications";
import { updateInvoice } from "@midday/db/queries";
import { logger } from "@trigger.dev/sdk";

export async function updateInvoiceStatus({
  invoiceId,
  teamId,
  status,
  paidAt,
}: {
  invoiceId: string;
  teamId: string;
  status: "overdue" | "paid";
  paidAt?: string;
}): Promise<void> {
  const updatedInvoice = await updateInvoice(getDb(), {
    id: invoiceId,
    teamId,
    status,
    paidAt,
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
