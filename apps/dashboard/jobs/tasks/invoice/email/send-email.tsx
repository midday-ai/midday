import { resend } from "@/utils/resend";
import InvoiceEmail from "@midday/email/emails/invoice";
import { createClient } from "@midday/supabase/job";
import { getAppUrl } from "@midday/utils/envs";
import { render } from "@react-email/render";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { nanoid } from "nanoid";
import { z } from "zod";

export const sendInvoiceEmail = schemaTask({
  id: "send-invoice-email",
  schema: z.object({
    invoiceId: z.string().uuid(),
  }),
  maxDuration: 300,
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

    const response = await resend.emails.send({
      from: "Midday <middaybot@midday.ai>",
      to: invoice?.customer.email,
      replyTo: invoice?.team.email,
      subject: `${invoice?.team.name} sent you an invoice`,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
      html: await render(
        <InvoiceEmail
          customerName={invoice?.customer.name}
          teamName={invoice?.team.name}
          link={`${getAppUrl()}/i/${invoice?.token}`}
        />,
      ),
    });

    logger.info("Invoice email sent", {
      invoiceId,
      response,
    });

    await supabase
      .from("invoices")
      .update({
        status: "unpaid",
        sent_to: invoice?.customer.email,
      })
      .eq("id", invoiceId);
  },
});
