import { getDb } from "@jobs/init";
import { Notifications } from "@midday/notifications";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";
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
    const notifications = new Notifications(getDb());

    const { data: invoice } = await supabase
      .from("invoices")
      .select(
        "id, token, template, invoice_number, team_id, customer:customer_id(name, website, email, billing_email), team:team_id(name, email), user:user_id(email)",
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

    if (invoice.invoice_number && invoice.customer?.name) {
      try {
        await notifications.create(
          "invoice_sent",
          invoice.team_id,
          {
            invoiceId,
            invoiceNumber: invoice.invoice_number,
            customerName: invoice.customer?.name,
            customerEmail,
            token: invoice.token,
          },
          {
            sendEmail: true,
            bcc,
            attachments,
            replyTo: invoice?.team.email ?? undefined,
          },
        );
      } catch (error) {
        logger.error("Failed to send invoice_sent notification", { error });

        throw new Error("Invoice email failed to send");
      }
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
