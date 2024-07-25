import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { download } from "@midday/supabase/storage";

export const preferredRegion = ["fra1", "sfo1", "iad1"];

export async function GET(req, res) {
  const supabase = createClient();
  const user = await getUser();
  const requestUrl = new URL(req.url);
  const path = requestUrl.searchParams.get("path");
  const filename = requestUrl.searchParams.get("filename");

  const { data } = await download(supabase, {
    bucket: "vault",
    path: `${user.data.team_id}/${path}`,
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
