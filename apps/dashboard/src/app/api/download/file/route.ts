import { createClient } from "@midday/supabase/server";
import { download } from "@midday/supabase/storage";
import type { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
  const supabase = await createClient();
  const requestUrl = new URL(req.url);
  const path = requestUrl.searchParams.get("path");
  const filename = requestUrl.searchParams.get("filename");

  if (!path) {
    return new Response("Path is required", { status: 400 });
  }

  const { data } = await download(supabase, {
    bucket: "vault",
    path,
  });

  const responseHeaders = new Headers(res.headers);

  responseHeaders.set(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );

  return new Response(data, {
    headers: responseHeaders,
  });
}
