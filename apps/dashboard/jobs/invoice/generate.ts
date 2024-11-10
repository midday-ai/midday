import { PdfTemplate, renderToBuffer } from "@midday/invoice";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const generateInvoice = schemaTask({
  id: "generate-invoice",
  schema: z.object({
    invoiceId: z.string().uuid(),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 10,
  },
  run: async (payload) => {
    const supabase = createClient();

    const { invoiceId } = payload;

    const { data: invoiceData } = await supabase
      .from("invoices")
      .select("*, customer:customer_id(name), user:user_id(timezone, locale)")
      .eq("id", invoiceId)
      .single()
      .throwOnError();

    const { user, ...invoice } = invoiceData;

    const buffer = await renderToBuffer(
      await PdfTemplate({
        ...invoice,
        timezone: user?.timezone,
        locale: user?.locale,
      }),
    );

    const filename = `${invoiceData?.invoice_number}.pdf`;

    await supabase.storage
      .from("vault")
      .upload(`${invoiceData?.team_id}/invoices/${filename}`, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    logger.debug("PDF uploaded to storage");

    await supabase
      .from("invoices")
      .update({
        file_path: ["invoices", filename],
        file_size: buffer.length,
      })
      .eq("id", invoiceId);

    logger.info("Invoice generation completed", { invoiceId, filename });
  },
});
