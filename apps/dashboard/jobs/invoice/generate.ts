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
    const { invoiceId } = payload;

    const supabase = createClient();

    const { data: invoiceData } = await supabase
      .from("invoices")
      .select("*, customer:customer_id(name)")
      .eq("id", invoiceId)
      .single()
      .throwOnError();

    const buffer = await renderToBuffer(await PdfTemplate(invoiceData));

    const filename = `${invoiceData.invoice_number}.pdf`;

    const { path } = await supabase.storage
      .from("vault")
      .upload(`${invoiceData.team_id}/invoices/${filename}`, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    await supabase
      .from("invoices")
      .update({
        file_path: ["invoices", filename],
      })
      .eq("id", invoiceId);
  },
});
