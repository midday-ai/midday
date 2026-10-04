import { getAuth } from "@midday/auth/server";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { isLocalBackend } from "@midday/utils/backend";
import { sanitizeRedirectPath } from "@midday/utils/sanitize-redirect";
import { addSeconds, addYears } from "date-fns";
import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTRPCClient } from "@/trpc/server";
import { Cookies } from "@/utils/constants";
import { getUrl } from "@/utils/environment";
import { isBlockedNewUser } from "@/utils/new-user-gate";

export async function GET(req: NextRequest) {
  if (!isLocalBackend()) return new Response("Not found", { status: 404 });
  const auth = await getAuth();
  const cookieStore = await cookies();
  const requestUrl = new URL(req.url);
  const origin = getUrl();
  const returnTo = requestUrl.searchParams.get("return_to");
  const provider = requestUrl.searchParams.get("provider");

  if (provider) {
    cookieStore.set(Cookies.PreferredSignInProvider, provider, {
      expires: addYears(new Date(), 1),
    });
  }

  const session = await getSession();
  if (!session) return NextResponse.redirect(`${origin}/login`);
  if (session) {
    if (isBlockedNewUser(session.user.createdAt)) {
      await auth.api.signOut({ headers: await headers() });
      return NextResponse.redirect(`${origin}/login?waitlist=1`);
    }

    // Set cookie to force primary database reads for subsequent client-side
    // requests after redirect. This prevents replication lag issues when the
    // user record hasn't replicated to read replicas yet.
    cookieStore.set(Cookies.ForcePrimary, "true", {
      expires: addSeconds(new Date(), 30),
      httpOnly: false, // Needs to be readable by client-side tRPC
      sameSite: "lax",
    });

    // If user is redirected from an invite, redirect to teams page to accept/decline the invite
    if (returnTo?.startsWith("teams/invite/")) {
      const analytics = await setupAnalytics();
      analytics.track({
        event: LogEvents.SignIn.name,
        channel: LogEvents.SignIn.channel,
        provider: provider ?? "unknown",
        destination: "teams",
      });

      return NextResponse.redirect(`${origin}/teams`);
    }

    // Explicitly force primary reads for this query -- the user may have
    // just been created and not yet replicated to read replicas.
    const trpcClient = await getTRPCClient({ forcePrimary: true });
    const user = await trpcClient.user.me.query();

    const isOnboarding = !user?.fullName || !user.teamId;
    const analytics = await setupAnalytics();

    analytics.track({
      event: LogEvents.SignIn.name,
      channel: LogEvents.SignIn.channel,
      provider: provider ?? "unknown",
      destination: isOnboarding ? "onboarding" : "dashboard",
    });

    if (isOnboarding) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  if (returnTo) {
    // The middleware strips the leading "/" (e.g. "settings/accounts"),
    // but sanitizeRedirectPath requires a root-relative path starting with "/".
    const normalized = returnTo.startsWith("/") ? returnTo : `/${returnTo}`;
    const safePath = sanitizeRedirectPath(normalized);
    return NextResponse.redirect(`${origin}${safePath}`);
  }

  return NextResponse.redirect(origin);
}
