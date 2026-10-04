import { TZDate } from "@date-fns/tz";
import { getDb } from "@jobs/init";
import { updateInvoiceStatus } from "@jobs/utils/update-invocie";
import {
  createTransactionAttachment,
  findUnfulfilledTransactionsForInvoice,
  getInvoiceById,
} from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { subDays } from "date-fns";
import { z } from "zod";

export const checkInvoiceStatus = schemaTask({
  id: "check-invoice-status",
  schema: z.object({
    invoiceId: z.string().uuid(),
  }),
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ invoiceId }) => {
    const invoice = await getInvoiceById(getDb(), { id: invoiceId });

    if (!invoice) {
      logger.error("Invoice data is missing");
      return;
    }

    if (!invoice.amount || !invoice.currency || !invoice.dueDate) {
      logger.error("Invoice data is missing");
      return;
    }

    const timezone = invoice.template?.timezone || "UTC";

    // Find recent transactions matching invoice amount, currency, and team_id
    const transactions = await findUnfulfilledTransactionsForInvoice(getDb(), {
      teamId: invoice.teamId,
      amount: invoice.amount,
      currency: invoice.currency,
      since: subDays(new TZDate(new Date(), timezone), 3).toISOString(),
    });

    // We have a match
    if (transactions && transactions.length === 1) {
      const transactionId = transactions.at(0)?.id;
      const filename = `${invoice.invoiceNumber}.pdf`;

      // Attach the invoice file to the transaction and mark as paid
      const attachment = await createTransactionAttachment(getDb(), {
        type: "application/pdf",
        path: invoice.filePath,
        transactionId: transactionId!,
        teamId: invoice.teamId,
        name: filename,
        size: invoice.fileSize,
      });
      if (!attachment) throw new Error("Transaction not found");

      await updateInvoiceStatus({
        invoiceId,
        teamId: invoice.teamId,
        status: "paid",
        paidAt: new Date().toISOString(),
      });
    } else {
      // Check if the invoice is overdue
      const isOverdue =
        new TZDate(invoice.dueDate, timezone) <
        new TZDate(new Date(), timezone);

      // Update invoice status to overdue if it's past due date and currently unpaid
      if (isOverdue && invoice.status === "unpaid") {
        await updateInvoiceStatus({
          invoiceId,
          teamId: invoice.teamId,
          status: "overdue",
        });
      }
    }
  },
});
