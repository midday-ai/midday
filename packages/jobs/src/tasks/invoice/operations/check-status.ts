import { TZDate } from "@date-fns/tz";
import { getDb } from "@jobs/init";
import { updateInvoiceStatus } from "@jobs/utils/update-invocie";
import { getInvoiceById } from "@midday/db/queries";
import { getTransactionsByFilters } from "@midday/db/queries";
import { createTransactionAttachment } from "@midday/db/queries";
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
    const db = getDb();

    const invoice = await getInvoiceById(db, {
      id: invoiceId,
      // No teamId needed in trusted job context
    });

    if (!invoice) {
      logger.error("Invoice data is missing");
      return;
    }

    if (!invoice.amount || !invoice.currency || !invoice.dueDate) {
      logger.error("Invoice data is missing");
      return;
    }

    // @ts-expect-error JSONB
    const timezone = invoice.template?.timezone || "UTC";

    // Find recent transactions matching invoice amount, currency, and team_id
    const transactions = await getTransactionsByFilters(db, {
      teamId: invoice.teamId,
      amount: invoice.amount,
      currency: invoice.currency,
      fromDate: subDays(new TZDate(new Date(), timezone), 3).toISOString(),
      isFulfilled: false,
    });

    // We have a match
    if (transactions && transactions.length === 1) {
      const transactionId = transactions.at(0)?.id;
      const filename = `${invoice.invoiceNumber}.pdf`;

      // Attach the invoice file to the transaction and mark as paid
      await createTransactionAttachment(db, {
        type: "application/pdf",
        path: invoice.filePath,
        transactionId: transactionId!,
        teamId: invoice.teamId,
        name: filename,
        size: invoice.fileSize,
      });

      await updateInvoiceStatus({
        invoiceId,
        status: "paid",
        paid_at: new Date().toISOString(),
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
          status: "overdue",
        });
      }
    }
  },
});
