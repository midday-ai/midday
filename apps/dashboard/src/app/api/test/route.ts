import { type NextRequest, NextResponse } from "next/server";

const accessToken = "";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const page = Number(requestUrl.searchParams.get("page") ?? 0);

  const response = await fetch(
    `https://bankaccountdata.gocardless.com/api/v2/requisitions?limit=100&offset=${page * 100}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return NextResponse.json(await response.json());
}
