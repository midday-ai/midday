import { client } from "@midday/engine-client";
import type { ReconnectConnectionPayload } from "@midday/jobs/schema";
import { getSession } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { tasks } from "@trigger.dev/sdk";
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
        .select("id, team_id")
        .single();

      // Trigger the reconnect job to safely update account IDs
      // This uses the shared matchAndUpdateAccountIds function to prevent
      // the multiple-row update issue when accounts share the same account_reference
      if (data?.id && data?.team_id) {
        await tasks.trigger("reconnect-connection", {
          teamId: data.team_id,
          connectionId: data.id,
          provider: "enablebanking",
        } satisfies ReconnectConnectionPayload);
      }

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
