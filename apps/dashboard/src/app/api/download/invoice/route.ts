import { PdfTemplate, renderToStream } from "@midday/invoice";
import { getInvoiceQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import type { NextRequest } from "next/server";

export const preferredRegion = ["fra1", "sfo1", "iad1"];
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createClient({ admin: true });
  const requestUrl = new URL(req.url);
  const id = requestUrl.searchParams.get("id");
  const size = requestUrl.searchParams.get("size") as "letter" | "a4";
  const preview = requestUrl.searchParams.get("preview") === "true";

  if (!id) {
    return new Response("No invoice id provided", { status: 400 });
  }

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
