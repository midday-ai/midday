import { createClient } from "@midday/supabase/server";

export const preferredRegion = "fra1";
export const runtime = "edge";

export async function GET(req, res) {
  const supabase = createClient();
  const requestUrl = new URL(req.url);
  const path = requestUrl.searchParams.get("path");
  const filename = requestUrl.searchParams.get("filename");

  const { data } = await supabase.storage.from("files").download(path);
  const responseHeaders = new Headers(res.headers);

  responseHeaders.set(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );

  return new Response(data, {
    headers: responseHeaders,
  });
}
