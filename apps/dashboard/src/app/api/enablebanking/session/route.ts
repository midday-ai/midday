import { client } from "@midday/engine/client";
import { getSession } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export const preferredRegion = ["fra1", "sfo1", "iad1"];
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const requestUrl = new URL(request.url);
  const supabase = createClient();

  const {
    data: { session },
  } = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }

  const [type, method] = state?.split(":") ?? [];

  const isDesktop = type === "desktop";
  const redirectBase = isDesktop ? "midday://" : requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", redirectBase));
  }

  const sessionResponse = await client.auth.enablebanking.exchange.$get({
    query: {
      code,
    },
  });

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

  if (method === "reconnect") {
    // TODO: Update reference id to the new session id
    // Find bank connection by account ids?
    const { data: sessionData } = await sessionResponse.json();

    if (sessionData?.session_id) {
      const { data } = await supabase
        .from("bank_connections")
        .update({
          expires_at: sessionData.expires_at,
          status: "connected",
        })
        .eq("reference_id", sessionData.session_id)
        .select("id")
        .single();

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
