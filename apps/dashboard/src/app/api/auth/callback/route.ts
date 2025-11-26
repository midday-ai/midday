import { Cookies } from "@/utils/constants";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { getSession } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { addSeconds, addYears } from "date-fns";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const client = requestUrl.searchParams.get("client");
  const returnTo = requestUrl.searchParams.get("return_to");
  const provider = requestUrl.searchParams.get("provider");

  if (client === "desktop") {
    return NextResponse.redirect(`${requestUrl.origin}/verify?code=${code}`);
  }

  if (provider) {
    cookieStore.set(Cookies.PreferredSignInProvider, provider, {
      expires: addYears(new Date(), 1),
    });
  }

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { session },
    } = await getSession();

    if (session) {
      const userId = session.user.id;

      // Set cookie to force primary database reads for new users (10 seconds)
      // This prevents replication lag issues when user record hasn't replicated yet
      cookieStore.set(Cookies.ForcePrimary, "true", {
        expires: addSeconds(new Date(), 10),
        httpOnly: false, // Needs to be readable by client-side tRPC
        sameSite: "lax",
      });

      const analytics = await setupAnalytics();

      await analytics.track({
        event: LogEvents.SignIn.name,
        channel: LogEvents.SignIn.channel,
      });

      // If user is redirected from an invite, redirect to teams page to accept/decline the invite
      if (returnTo?.startsWith("teams/invite/")) {
        return NextResponse.redirect(`${requestUrl.origin}/teams`);
      }

      // If user have no teams, redirect to team creation
      const { count } = await supabase
        .from("users_on_team")
        .select("*", { count: "exact" })
        .eq("user_id", userId);

      if (count === 0 && !returnTo?.startsWith("teams/invite/")) {
        return NextResponse.redirect(`${requestUrl.origin}/teams/create`);
      }
    }
  }

  if (returnTo) {
    return NextResponse.redirect(`${requestUrl.origin}/${returnTo}`);
  }

  return NextResponse.redirect(requestUrl.origin);
}
