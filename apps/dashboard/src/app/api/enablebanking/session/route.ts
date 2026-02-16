import { getSession } from "@midday/supabase/cached-queries";
import { type NextRequest, NextResponse } from "next/server";
import { getTRPCClient } from "@/trpc/server";
import { getUrl } from "@/utils/environment";

export async function GET(request: NextRequest) {
  const origin = getUrl();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

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

  const trpc = await getTRPCClient();

  let sessionData:
    | Awaited<ReturnType<typeof trpc.banking.enablebankingExchange.mutate>>
    | undefined;

  try {
    sessionData = await trpc.banking.enablebankingExchange.mutate({ code });
  } catch {
    return NextResponse.redirect(new URL("/?error=invalid_code", redirectBase));
  }

  if (method === "connect") {
    return NextResponse.redirect(
      new URL(
        `/?ref=${sessionData.data.session_id}&provider=enablebanking&step=account`,
        redirectBase,
      ),
    );
  }

  if (method === "reconnect" && sessionId) {
    const connection = await trpc.bankConnections.reconnect.mutate({
      referenceId: sessionId,
      newReferenceId: sessionData.data.session_id,
      expiresAt: sessionData.data.expires_at,
    });

    return NextResponse.redirect(
      new URL(
        `/settings/accounts?id=${connection.id}&step=reconnect`,
        redirectBase,
      ),
    );
  }

  return NextResponse.redirect(new URL("/", redirectBase));
}
