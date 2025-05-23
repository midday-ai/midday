import { trpc } from "@/trpc/server";
import { getQueryClient } from "@/trpc/server";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { PdfTemplate, renderToStream } from "@midday/invoice";
import type { NextRequest } from "next/server";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().uuid().optional(),
  token: z.string().optional(),
  preview: z.preprocess((val) => val === "true", z.boolean().default(false)),
});

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);

  const result = paramsSchema.safeParse(
    Object.fromEntries(requestUrl.searchParams.entries()),
  );

  if (!result.success) {
    return new Response("Invalid parameters", { status: 400 });
  }

  const queryClient = getQueryClient();

  const { id, token, preview } = result.data;

  let data: RouterOutputs["invoice"]["getInvoiceByToken"] | null = null;

  if (id) {
    data = await queryClient.fetchQuery(
      trpc.invoice.getById.queryOptions({ id }),
    );
  } else if (token) {
    data = await queryClient.fetchQuery(
      trpc.invoice.getInvoiceByToken.queryOptions({ token }),
    );
  }

  if (!data) {
    return new Response("Invoice not found", { status: 404 });
  }

  const stream = await renderToStream(await PdfTemplate(data));

  // @ts-expect-error - stream is not assignable to BodyInit
  const blob = await new Response(stream).blob();

  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Cache-Control": "no-store, max-age=0",
  };

  if (!preview) {
    headers["Content-Disposition"] =
      `attachment; filename="${data.invoiceNumber}.pdf"`;
  }

  return new Response(blob, { headers });
}
