import { resend } from "@/utils/resend";
import InvoiceEmail from "@midday/email/emails/invoice";
import { render } from "@midday/email/render";
import { encrypt } from "@midday/encryption";
import { createClient } from "@midday/supabase/job";
import { getAppUrl } from "@midday/utils/envs";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { nanoid } from "nanoid";
import { z } from "zod";

export const sendInvoiceEmail = schemaTask({
  id: "send-invoice-email",
  schema: z.object({
    invoiceId: z.string().uuid(),
  }),
  maxDuration: 30,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ invoiceId }) => {
    const supabase = createClient();

    const { data: invoice } = await supabase
      .from("invoices")
      .select(
        "id, token, customer:customer_id(name, website, email), team:team_id(name, email)",
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
      subject: `${invoice?.team.name} sent you an invoice`,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
      html: render(
        <InvoiceEmail
          customerName={invoice?.customer?.name!}
          teamName={invoice?.team.name!}
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

    await supabase
      .from("invoices")
      .update({
        status: "unpaid",
        sent_to: customerEmail,
      })
      .eq("id", invoiceId);
  },
});
