import { createClient } from "@midday/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const supabase = createClient();
  const requestUrl = new URL(req.url);
  const filePath = requestUrl.searchParams.get("filePath");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${filePath}`,
    {
      cache: "no-cache",
      headers: {
        authorization: `Bearer ${session.access_token}`,
      },
    }
  );
}
