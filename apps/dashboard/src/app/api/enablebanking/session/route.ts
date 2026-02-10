import { client } from "@midday/engine-client";
import { getSession } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { getUrl } from "@/utils/environment";

export async function GET(request: NextRequest) {
  const origin = getUrl();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const supabase = await createClient();

  const {
    data: { session },
  } = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const [type, method, sessionId] = state?.split(":") ?? [];

  const isDesktop = type === "desktop";
  const scheme = process.env.NEXT_PUBLIC_DESKTOP_SCHEME || "midday";
  const redirectBase = isDesktop ? `${scheme}://` : origin;

  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", redirectBase));
  }

  const sessionResponse = await client.auth.enablebanking.exchange.$get({
    query: {
      code,
    },
  });

  if (sessionResponse.status !== 200) {
    return NextResponse.redirect(new URL("/?error=invalid_code", redirectBase));
  }

  if (method === "connect") {
    const { data: sessionData } = await sessionResponse.json();

    if (sessionData?.session_id) {
      return NextResponse.redirect(
        new URL(
          `/?ref=${sessionData.session_id}&provider=enablebanking&step=account`,
          redirectBase,
        ),
      );
    }
  }

  if (method === "reconnect" && sessionId) {
    const { data: sessionData } = await sessionResponse.json();

    // Update the bank connection session
    if (sessionData?.session_id) {
      const { data } = await supabase
        .from("bank_connections")
        .update({
          expires_at: sessionData.expires_at,
          reference_id: sessionData.session_id,
          status: "connected",
        })
        .eq("reference_id", sessionId)
        .select("id")
        .single();

      // Redirect to frontend which will trigger the reconnect job
      return NextResponse.redirect(
        new URL(
          `/settings/accounts?id=${data?.id}&step=reconnect`,
          redirectBase,
        ),
      );
    }
  }

  return NextResponse.redirect(new URL("/", redirectBase));
}
