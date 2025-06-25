import { getInvoiceById, updateInvoice } from "@midday/db/queries";
import InvoiceEmail from "@midday/email/emails/invoice";
import { encrypt } from "@midday/encryption";
import { createClient } from "@midday/supabase/job";
import { getAppUrl } from "@midday/utils/envs";
import { render } from "@react-email/render";
import { job } from "@worker/core/job";
import { emailQueue } from "@worker/queues/queues";
import { resend } from "@worker/services/resend";
import { nanoid } from "nanoid";
import { z } from "zod";

export const sendInvoiceEmailJob = job(
  "send-invoice-email",
  z.object({
    invoiceId: z.string().uuid(),
    filename: z.string(),
    fullPath: z.string(),
  }),
  {
    queue: emailQueue,
    attempts: 3,
    priority: 2,
    removeOnComplete: 50,
  },
  async ({ invoiceId, filename, fullPath }, ctx) => {
    ctx.logger.info("Sending invoice email", {
      invoiceId,
      filename,
      fullPath,
    });

    const supabase = createClient();

    const invoice = await getInvoiceById(ctx.db, { id: invoiceId });

    if (!invoice) {
      ctx.logger.error("Invoice not found", { invoiceId });
      throw new Error("Invoice not found");
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
      ...(invoice?.customer?.billingEmail
        ? [invoice?.customer?.billingEmail]
        : []),
      ...(shouldSendCopy && userEmail ? [userEmail] : []),
    ];

    if (!customerEmail) {
      ctx.logger.error("Invoice customer email not found", { invoiceId });
      throw new Error("Invoice customer email not found");
    }

    const response = await resend.emails.send({
      from: "Midday <middaybot@midday.ai>",
      to: customerEmail,
      bcc,
      replyTo: invoice?.team?.email ?? undefined,
      subject: `${invoice?.team?.name} sent you an invoice`,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
      attachments,
      html: await render(
        InvoiceEmail({
          customerName: invoice?.customer?.name!,
          teamName: invoice?.team?.name!,
          link: `${getAppUrl()}/i/${encodeURIComponent(
            invoice?.token,
          )}?viewer=${encodeURIComponent(encrypt(customerEmail))}`,
        }),
      ),
    });

    if (response.error) {
      ctx.logger.error("Invoice email failed to send", {
        invoiceId,
        error: response.error,
      });
      throw new Error("Invoice email failed to send");
    }

    ctx.logger.info("Invoice email sent successfully", { invoiceId });

    await updateInvoice(ctx.db, {
      id: invoiceId,
      teamId: invoice.team?.id!,
      status: "unpaid",
      sentTo: customerEmail,
      sentAt: new Date().toISOString(),
    });

    return {
      type: "invoice-email-sent",
      invoiceId,
      sentTo: customerEmail,
      sentAt: new Date(),
    };
  },
);
