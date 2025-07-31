import { sendInvoiceReminderSchema } from "@jobs/schema";
import { resend } from "@jobs/utils/resend";
import InvoiceReminderEmail from "@midday/email/emails/invoice-reminder";
import { render } from "@midday/email/render";
import { encrypt } from "@midday/encryption";
import { createClient } from "@midday/supabase/job";
import { getAppUrl } from "@midday/utils/envs";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { nanoid } from "nanoid";

export const sendInvoiceReminder = schemaTask({
  id: "send-invoice-reminder",
  schema: sendInvoiceReminderSchema,
  maxDuration: 60,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ invoiceId }) => {
    const supabase = createClient();

    const { data: invoice } = await supabase
      .from("invoices")
      .select(
        "id, token, invoice_number, customer:customer_id(name, website, email), team:team_id(name, email)",
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

    const response = await resend.emails.send({
      from: "Midday <middaybot@midday.ai>",
      to: customerEmail,
      replyTo: invoice?.team.email ?? undefined,
      subject: `Reminder: Payment for ${invoice.invoice_number}`,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
      html: render(
        <InvoiceReminderEmail
          companyName={invoice.customer?.name!}
          teamName={invoice.team.name!}
          invoiceNumber={invoice.invoice_number!}
          link={`${getAppUrl()}/i/${encodeURIComponent(
            invoice?.token,
          )}?viewer=${encodeURIComponent(encrypt(customerEmail))}`}
        />,
      ),
    });

    if (response.error) {
      logger.error("Invoice email failed to send", {
        invoiceId,
        error: response.error,
      });

      throw new Error("Invoice email failed to send");
    }

    logger.info("Invoice email sent");
  },
});
