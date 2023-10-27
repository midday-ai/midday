import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient();
  const requestUrl = new URL(req.url);
  const path = requestUrl.searchParams.get("path");
  const filename = requestUrl.searchParams.get("filename");

  const { data } = await supabase.storage.from("documents").download(path);
  const responseHeaders = new Headers(res.headers);

  responseHeaders.set(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );

  return new Response(data, {
    headers: responseHeaders,
  });
}
