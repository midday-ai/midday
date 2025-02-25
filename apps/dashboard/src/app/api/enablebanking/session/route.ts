import { client } from "@midday/engine/client";
import { type NextRequest, NextResponse } from "next/server";

export const preferredRegion = ["fra1", "sfo1", "iad1"];
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", request.url));
  }

  const sessionResponse = await client.auth.enablebanking.exchange.$get({
    query: {
      code,
    },
  });

  const {
    data: sessionData,
    code: errorCode,
    ...rest
  } = await sessionResponse.json();

  console.log({ sessionData, errorCode, rest });

  if (sessionData?.session_id) {
    return NextResponse.redirect(
      new URL(
        `/?ref=${sessionData.session_id}&provider=enablebanking&step=account`,
        request.url,
      ),
    );
  }

  if (errorCode === "already_authorized") {
    return NextResponse.redirect(
      new URL("/?error=already_authorized", request.url),
    );
  }

  return NextResponse.json({
    code,
  });
}
