import { TZDate } from "@date-fns/tz";
import { updateInvoiceStatus } from "@jobs/utils/update-invocie";
import { createClient } from "@midday/supabase/job";
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
    const supabase = createClient();

    const { data: invoice } = await supabase
      .from("invoices")
      .select(
        "id, status, due_date, currency, amount, team_id, file_path, invoice_number, file_size, template",
      )
      .eq("id", invoiceId)
      .single();

    if (!invoice) {
      logger.error("Invoice data is missing");
      return;
    }

    if (!invoice.amount || !invoice.currency || !invoice.due_date) {
      logger.error("Invoice data is missing");
      return;
    }

    // @ts-expect-error JSONB
    const timezone = invoice.template?.timezone || "UTC";

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
        subDays(new TZDate(new Date(), timezone), 3).toISOString(),
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
        status: "paid",
        paid_at: new Date().toISOString(),
      });
    } else {
      // Check if the invoice is overdue
      const isOverdue =
        new TZDate(invoice.due_date, timezone) <
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
