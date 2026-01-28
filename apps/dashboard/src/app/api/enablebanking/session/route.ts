import { getTRPCClient } from "@/trpc/server";
import { getSession } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const requestUrl = new URL(request.url);
  const supabase = await createClient();

  const {
    data: { session },
  } = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }

  const [type, method, sessionId] = state?.split(":") ?? [];

  const isDesktop = type === "desktop";
  const redirectBase = isDesktop ? "midday://" : requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", redirectBase));
  }

  try {
    const trpc = await getTRPCClient();
    const sessionData = await trpc.banking.exchangeEnableBankingCode.query({
      code,
    });

    if (method === "connect") {
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
        // The frontend handles job triggering to track progress via runId/accessToken
        return NextResponse.redirect(
          new URL(
            `/settings/accounts?id=${data?.id}&step=reconnect`,
            redirectBase,
          ),
        );
      }
    }
  } catch (error) {
    console.error("EnableBanking exchange error:", error);
    return NextResponse.redirect(new URL("/?error=invalid_code", redirectBase));
  }

  return NextResponse.redirect(new URL("/", redirectBase));
}
