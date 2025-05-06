import { getSession } from "@midday/supabase/cached-queries";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const filePath = requestUrl.searchParams.get("filePath");

  const {
    data: { session },
  } = await getSession();

  if (!session || !filePath) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Ensure filePath starts with 'vault/'
  const finalFilePath = filePath.startsWith("vault/")
    ? filePath
    : `vault/${filePath}`;

  // Fetch the object from Supabase Storage
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${finalFilePath}`,
    {
      headers: {
        authorization: `Bearer ${session.access_token}`,
      },
    },
  );

  // Check if the fetch was successful
  if (!response.ok) {
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
