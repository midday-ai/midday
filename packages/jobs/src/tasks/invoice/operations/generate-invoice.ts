import { processDocument } from "@/tasks/document/process-document";
import { PdfTemplate, renderToBuffer } from "@midday/invoice";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { sendInvoiceEmail } from "../email/send-email";

export const generateInvoice = schemaTask({
  id: "generate-invoice",
  schema: z.object({
    invoiceId: z.string().uuid(),
    deliveryType: z.enum(["create", "create_and_send"]),
  }),
  maxDuration: 60,
  queue: {
    concurrencyLimit: 50,
  },
  run: async (payload) => {
    const supabase = createClient();

    const { invoiceId } = payload;

    const { data: invoiceData } = await supabase
      .from("invoices")
      .select(
        "*, team_id, customer:customer_id(name), user:user_id(timezone, locale)",
      )
      .eq("id", invoiceId)
      .single()
      .throwOnError();

    const { user, ...invoice } = invoiceData;

    const buffer = await renderToBuffer(await PdfTemplate(invoice));

    const filename = `${invoiceData?.invoice_number}.pdf`;
    const fullPath = `${invoiceData?.team_id}/invoices/${filename}`;

    await supabase.storage.from("vault").upload(fullPath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

    logger.debug("PDF uploaded to storage");

    await supabase
      .from("invoices")
      .update({
        file_path: [invoiceData?.team_id, "invoices", filename],
        file_size: buffer.length,
      })
      .eq("id", invoiceId);

    if (payload.deliveryType === "create_and_send") {
      await sendInvoiceEmail.trigger({
        invoiceId,
        filename,
        fullPath,
      });
    }

    await processDocument.trigger({
      file_path: [invoiceData?.team_id, "invoices", filename],
      mimetype: "application/pdf",
      teamId: invoiceData?.team_id,
    });

    logger.info("Invoice generation completed", { invoiceId, filename });
  },
});
