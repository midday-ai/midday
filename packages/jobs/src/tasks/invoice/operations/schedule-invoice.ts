import { getDb } from "@jobs/init";
import { scheduleInvoiceJobSchema } from "@jobs/schema";
import { getInvoiceById, updateInvoice } from "@midday/db/queries";
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

    const invoice = await getInvoiceById(getDb(), {
      id: invoiceId,
    });

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
    await updateInvoice(getDb(), {
      id: invoiceId,
      teamId: invoice.teamId, // Use the teamId from the invoice we retrieved
      status: "unpaid",
    });

    // Generate and send the invoice
    await generateInvoice.trigger({
      invoiceId,
      deliveryType: "create_and_send",
    });

    logger.info("Scheduled invoice sent successfully", { invoiceId });
  },
});
