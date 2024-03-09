import { createClient } from "@midday/supabase/server";

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
      headers: {
        authorization: `Bearer ${session.access_token}`,
      },
    }
  );
}
