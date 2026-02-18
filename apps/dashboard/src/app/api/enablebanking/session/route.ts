import { getSession } from "@midday/supabase/cached-queries";
import { sanitizeRedirectPath } from "@midday/utils/sanitize-redirect";
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

  const stateParts = state?.split(":") ?? [];
  const [type, method] = stateParts;
  // The third segment is either a sessionId (for reconnect) or an encoded redirectPath (for connect)
  const thirdSegment = stateParts[2];

  const isDesktop = type === "desktop";
  const scheme = process.env.NEXT_PUBLIC_DESKTOP_SCHEME || "midday";
  const redirectBase = isDesktop ? `${scheme}://` : origin;

  if (!code) {
    // User cancelled auth — redirect back to the original page (e.g. onboarding)
    const cancelRedirectPath =
      method === "connect" && thirdSegment
        ? sanitizeRedirectPath(thirdSegment)
        : "/";
    return NextResponse.redirect(new URL(cancelRedirectPath, redirectBase));
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

  const exchangeSessionId = sessionData.data.session_id;
  const exchangeExpiresAt = sessionData.data.expires_at;

  if (method === "connect" && exchangeSessionId) {
    const customRedirectPath = thirdSegment
      ? sanitizeRedirectPath(thirdSegment)
      : "/";
    const separator = customRedirectPath.includes("?") ? "&" : "?";
    return NextResponse.redirect(
      new URL(
        `${customRedirectPath}${separator}ref=${exchangeSessionId}&provider=enablebanking&step=account`,
        redirectBase,
      ),
    );
  }

  const sessionId = thirdSegment;

  if (
    method === "reconnect" &&
    sessionId &&
    exchangeSessionId &&
    exchangeExpiresAt
  ) {
    try {
      const connection = await trpc.bankConnections.reconnect.mutate({
        referenceId: sessionId,
        newReferenceId: exchangeSessionId,
        expiresAt: exchangeExpiresAt,
      });

      return NextResponse.redirect(
        new URL(
          `/settings/accounts?id=${connection.id}&step=reconnect`,
          redirectBase,
        ),
      );
    } catch {
      return NextResponse.redirect(
        new URL("/?error=reconnect_failed", redirectBase),
      );
    }
  }

  return NextResponse.redirect(new URL("/", redirectBase));
}
