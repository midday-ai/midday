import { getInvoiceById, updateInvoice } from "@midday/db/queries";
import InvoiceReminderEmail from "@midday/email/emails/invoice-reminder";
import { render } from "@midday/email/render";
import { encrypt } from "@midday/encryption";
import { getAppUrl } from "@midday/utils/envs";
import { job } from "@worker/core/job";
import { emailQueue } from "@worker/queues/queues";
import { resend } from "@worker/services/resend";
import { nanoid } from "nanoid";
import { z } from "zod";

export const sendInvoiceReminderJob = job(
  "send-invoice-reminder",
  z.object({
    invoiceId: z.string().uuid(),
  }),
  {
    queue: emailQueue,
    attempts: 3,
    priority: 2,
    removeOnComplete: 50,
  },
  async ({ invoiceId }, ctx) => {
    ctx.logger.info("Sending invoice reminder email", { invoiceId });

    const invoice = await getInvoiceById(ctx.db, { id: invoiceId });

    if (!invoice) {
      ctx.logger.error("Invoice not found", { invoiceId });
      throw new Error("Invoice not found");
    }

    const customerEmail = invoice?.customer?.email;

    if (!customerEmail) {
      ctx.logger.error("Invoice customer email not found", { invoiceId });
      throw new Error("Invoice customer email not found");
    }

    const response = await resend.emails.send({
      from: "Midday <middaybot@midday.ai>",
      to: customerEmail,
      replyTo: invoice?.team?.email ?? undefined,
      subject: `Reminder: Payment for ${invoice.invoiceNumber}`,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
      html: render(
        InvoiceReminderEmail({
          companyName: invoice.customer?.name!,
          teamName: invoice.team?.name!,
          invoiceNumber: invoice.invoiceNumber!,
          link: `${getAppUrl()}/i/${encodeURIComponent(
            invoice?.token,
          )}?viewer=${encodeURIComponent(encrypt(customerEmail))}`,
        }),
      ),
    });

    if (response.error) {
      ctx.logger.error("Invoice reminder email failed to send", {
        invoiceId,
        error: response.error,
      });
      throw new Error("Invoice reminder email failed to send");
    }

    ctx.logger.info("Invoice reminder email sent successfully", { invoiceId });

    // Update the invoice to mark when the reminder was sent
    await updateInvoice(ctx.db, {
      id: invoiceId,
      teamId: invoice.team?.id!,
      reminderSentAt: new Date().toISOString(),
    });

    return {
      type: "invoice-reminder-sent",
      invoiceId,
      sentTo: customerEmail,
      sentAt: new Date(),
    };
  },
);
