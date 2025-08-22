import { resend } from "@jobs/utils/resend";
import InvoiceEmail from "@midday/email/emails/invoice";
import { render } from "@midday/email/render";
import { encrypt } from "@midday/encryption";
import { createClient } from "@midday/supabase/job";
import { getAppUrl } from "@midday/utils/envs";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { nanoid } from "nanoid";
import { z } from "zod";

export const sendInvoiceEmail = schemaTask({
  id: "send-invoice-email",
  schema: z.object({
    invoiceId: z.string().uuid(),
    filename: z.string(),
    fullPath: z.string(),
  }),
  maxDuration: 30,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ invoiceId, filename, fullPath }) => {
    const supabase = createClient();

    const { data: invoice } = await supabase
      .from("invoices")
      .select(
        "id, token, template, customer:customer_id(name, website, email, billing_email), team:team_id(name, email), user:user_id(email)",
      )
      .eq("id", invoiceId)
      .single();

    if (!invoice) {
      logger.error("Invoice not found");
      return;
    }

    let attachments: { content: string; filename: string }[] | undefined;

    // @ts-expect-error template is a jsonb field
    if (invoice.template.includePdf) {
      const { data: attachmentData } = await supabase.storage
        .from("vault")
        .download(fullPath);

      attachments = attachmentData
        ? [
            {
              content: Buffer.from(await attachmentData.arrayBuffer()).toString(
                "base64",
              ),
              filename,
            },
          ]
        : undefined;
    }

    const customerEmail = invoice?.customer?.email;
    const userEmail = invoice?.user?.email;

    // @ts-expect-error template is a jsonb field
    const shouldSendCopy = invoice?.template?.sendCopy;

    const bcc = [
      ...(invoice?.customer?.billing_email
        ? [invoice?.customer?.billing_email]
        : []),
      ...(shouldSendCopy && userEmail ? [userEmail] : []),
    ];

    if (!customerEmail) {
      logger.error("Invoice customer email not found");
      return;
    }

    const response = await resend.emails.send({
      from: "Midday <middaybot@midday.ai>",
      to: customerEmail,
      bcc,
      replyTo: invoice?.team.email ?? undefined,
      subject: `${invoice?.team.name} sent you an invoice`,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
      attachments,
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
        sent_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);
  },
});
