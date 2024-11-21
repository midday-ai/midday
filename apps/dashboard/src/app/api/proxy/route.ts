import { getSession } from "@midday/supabase/cached-queries";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const filePath = requestUrl.searchParams.get("filePath");

  const {
    data: { session },
  } = await getSession();

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${filePath}`,
    {
      headers: {
        authorization: `Bearer ${session?.access_token}`,
      },
    },
  );
}
