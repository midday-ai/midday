import { PdfTemplate, renderToStream } from "@midday/invoice";
import { getInvoiceQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const preferredRegion = ["fra1", "sfo1", "iad1"];
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.string().uuid(),
  size: z.enum(["letter", "a4"]).default("a4"),
  preview: z.preprocess((val) => val === "true", z.boolean().default(false)),
});

export async function GET(req: NextRequest) {
  const supabase = createClient({ admin: true });
  const requestUrl = new URL(req.url);

  const result = paramsSchema.safeParse(
    Object.fromEntries(requestUrl.searchParams.entries()),
  );

  if (!result.success) {
    return new Response("Invalid parameters", { status: 400 });
  }

  const { id, size, preview } = result.data;

  const { data } = await getInvoiceQuery(supabase, id);

  if (!data) {
    return new Response("Invoice not found", { status: 404 });
  }

  const stream = await renderToStream(await PdfTemplate({ ...data, size }));

  const blob = await new Response(stream).blob();

  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Cache-Control": "no-store, max-age=0",
  };

  if (!preview) {
    headers["Content-Disposition"] =
      `attachment; filename="${data.invoice_number}.pdf"`;
  }

  return new Response(blob, { headers });
}
