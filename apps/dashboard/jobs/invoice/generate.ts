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
  run: async (payload) => {
    const supabase = createClient();

    const { invoiceId } = payload;

    const { data: invoiceData } = await supabase
      .from("invoices")
      .select("*, customer:customer_id(name)")
      .eq("id", invoiceId)
      .single()
      .throwOnError();

    const buffer = await renderToBuffer(await PdfTemplate(invoiceData));

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
      })
      .eq("id", invoiceId);

    logger.info("Invoice generation completed", { invoiceId, filename });
  },
});
