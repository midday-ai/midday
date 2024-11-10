import { TZDate } from "@date-fns/tz";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { subDays } from "date-fns";
import { z } from "zod";
import { updateInvoiceStatus } from "../utils/invocie/update-status";

export const checkInvoiceStatus = schemaTask({
  id: "check-invoice-status",
  schema: z.object({
    invoiceId: z.string().uuid(),
  }),
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ invoiceId }) => {
    const supabase = createClient();

    const { data: invoice } = await supabase
      .from("invoices")
      .select(
        "id, status, due_date, currency, amount, team_id, file_path, invoice_number, customer_name, file_size, user:user_id(timezone)",
      )
      .eq("id", invoiceId)
      .single();

    if (!invoice) {
      logger.error("Invoice data is missing");
      return;
    }

    if (
      !invoice.amount ||
      !invoice.currency ||
      !invoice.due_date ||
      !invoice.customer_name
    ) {
      logger.error("Invoice data is missing");
      return;
    }

    const userTimezone = invoice.user?.timezone || "UTC";

    // Find recent transactions matching invoice amount, currency, and team_id
    const { data: transactions } = await supabase
      .from("transactions")
      .select("id")
      .eq("team_id", invoice.team_id)
      .eq("amount", invoice.amount)
      .eq("currency", invoice.currency?.toUpperCase())
      .gte(
        "date",
        // Get the transactions from the last 3 days
        subDays(new TZDate(new Date(), userTimezone), 3).toISOString(),
      )
      .eq("is_fulfilled", false);

    // We have a match
    if (transactions && transactions.length === 1) {
      const transactionId = transactions.at(0)?.id;
      const filename = `${invoice.invoice_number}.pdf`;

      // Attach the invoice file to the transaction and mark as paid
      await supabase
        .from("transaction_attachments")
        .insert({
          type: "application/pdf",
          path: invoice.file_path,
          transaction_id: transactionId,
          team_id: invoice.team_id,
          name: filename,
          size: invoice.file_size,
        })
        .select()
        .single();

      await updateInvoiceStatus({
        invoiceId,
        customerName: invoice.customer_name,
        status: "paid",
      });
    } else {
      // Check if the invoice is overdue
      const isOverdue =
        new TZDate(invoice.due_date, userTimezone) <
        new TZDate(new Date(), userTimezone);

      // Update invoice status to overdue if it's past due date and currently unpaid
      if (isOverdue && invoice.status === "unpaid") {
        await updateInvoiceStatus({
          invoiceId,
          customerName: invoice.customer_name,
          status: "overdue",
        });
      }
    }
  },
});
