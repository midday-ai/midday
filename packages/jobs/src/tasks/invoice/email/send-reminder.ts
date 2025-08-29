import { getDb } from "@jobs/init";
import { sendInvoiceReminderSchema } from "@jobs/schema";
import { Notifications } from "@midday/notifications";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";

export const sendInvoiceReminder = schemaTask({
  id: "send-invoice-reminder",
  schema: sendInvoiceReminderSchema,
  maxDuration: 60,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ invoiceId }) => {
    const supabase = createClient();
    const notifications = new Notifications(getDb());

    const { data: invoice } = await supabase
      .from("invoices")
      .select(
        "id, token, invoice_number, team_id, customer:customer_id(name, website, email), team:team_id(name, email)",
      )
      .eq("id", invoiceId)
      .single();

    if (!invoice) {
      logger.error("Invoice not found");
      return;
    }

    const customerEmail = invoice?.customer?.email;

    if (!customerEmail) {
      logger.error("Invoice customer email not found");
      return;
    }

    try {
      await notifications.create(
        "invoice_reminder_sent",
        invoice.team_id,
        {
          invoiceId,
          invoiceNumber: invoice.invoice_number!,
          customerName: invoice.customer?.name!,
          customerEmail,
          token: invoice.token,
        },
        {
          sendEmail: true,
          replyTo: invoice?.team.email ?? undefined,
        },
      );
    } catch (error) {
      logger.error("Failed to send invoice_reminder_sent notification", {
        error,
      });

      throw new Error("Invoice reminder email failed to send");
    }

    logger.info("Invoice reminder email sent");
  },
});
