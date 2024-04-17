import { Cookies } from "@/utils/constants";
import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { createClient } from "@midday/supabase/server";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const preferredRegion = ["fra1", "sfo1"];

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const client = requestUrl.searchParams.get("client");
  const returnTo = requestUrl.searchParams.get("return_to");
  const provider = requestUrl.searchParams.get("provider");
  const mfaSetupVisited = cookieStore.has(Cookies.MfaSetupVisited);

  if (client === "desktop") {
    return NextResponse.redirect(`${requestUrl.origin}/verify?code=${code}`);
  }

  if (provider) {
    cookieStore.set(Cookies.PreferredSignInProvider, provider, {
      expires: addYears(new Date(), 1),
    });
  }

  if (code) {
    const supabase = createClient(cookieStore);
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const userId = user.id;

      const logsnag = await setupLogSnag({
        userId,
        fullName: user.full_name,
      });

      await logsnag.track({
        event: LogEvents.SignIn.name,
        icon: LogEvents.SignIn.icon,
        notify: true,
        channel: LogEvents.SignIn.channel,
      });
    }
  }

  if (!mfaSetupVisited) {
    cookieStore.set(Cookies.MfaSetupVisited, "true", {
      expires: addYears(new Date(), 1),
    });

    return NextResponse.redirect(`${requestUrl.origin}/mfa/setup`);
  }

  if (returnTo) {
    return NextResponse.redirect(`${requestUrl.origin}/${returnTo}`);
  }

  return NextResponse.redirect(requestUrl.origin);
}
