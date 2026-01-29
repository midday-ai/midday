import { getTRPCClient } from "@/trpc/server";
import { logger } from "@/utils/logger";
import { getSession } from "@midday/supabase/cached-queries";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const requestUrl = new URL(request.url);

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

    if (method === "reconnect" && sessionId && sessionData?.session_id) {
      const trpc = await getTRPCClient();
      const updated = await trpc.bankConnections.updateSessionByReference.mutate({
        previousReferenceId: sessionId,
        referenceId: sessionData.session_id,
        expiresAt: sessionData.expires_at ?? null,
      });

      // Redirect to frontend which will trigger the reconnect job
      // The frontend handles job triggering to track progress via runId/accessToken
      return NextResponse.redirect(
        new URL(
          `/settings/accounts?id=${updated?.id}&step=reconnect`,
          redirectBase,
        ),
      );
    }
  } catch (error) {
    logger("EnableBanking exchange error", { error });
    return NextResponse.redirect(new URL("/?error=invalid_code", redirectBase));
  }

  return NextResponse.redirect(new URL("/", redirectBase));
}
