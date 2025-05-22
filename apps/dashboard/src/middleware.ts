import { updateSession } from "@midday/supabase/middleware";
import { createClient } from "@midday/supabase/server";
import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  const response = await updateSession(request, I18nMiddleware(request));
  const supabase = await createClient();
  const url = new URL("/", request.url);
  const nextUrl = request.nextUrl;

  const pathnameLocale = nextUrl.pathname.split("/", 2)?.[1];

  // Remove the locale from the pathname
  const pathnameWithoutLocale = pathnameLocale
    ? nextUrl.pathname.slice(pathnameLocale.length + 1)
    : nextUrl.pathname;

  // Create a new URL without the locale in the pathname
  const newUrl = new URL(pathnameWithoutLocale || "/", request.url);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 1. Not authenticated
  if (
    !session &&
    newUrl.pathname !== "/login" &&
    !newUrl.pathname.includes("/i/")
  ) {
    const encodedSearchParams = `${newUrl.pathname.substring(1)}${
      newUrl.search
    }`;

    const url = new URL("/login", request.url);

    if (encodedSearchParams) {
      url.searchParams.append("return_to", encodedSearchParams);
    }

    return NextResponse.redirect(url);
  }

  // If authenticated, proceed with other checks
  if (session) {
    // 2. Check user setup (full_name)
    if (
      newUrl.pathname !== "/setup" &&
      newUrl.pathname !== "/teams/create" &&
      newUrl.pathname !== "/teams" &&
      !session?.user?.user_metadata?.full_name
    ) {
      // Check if the URL contains an invite code
      const inviteCodeMatch = newUrl.pathname.startsWith("/teams/invite/");

      if (inviteCodeMatch) {
        // Allow proceeding to invite page even without setup
        // Redirecting with the original path including locale if present
        return NextResponse.redirect(
          `${url.origin}${request.nextUrl.pathname}`,
        );
      }
      // Redirect to setup if not on setup, create team, or invite page and full_name is missing
      return NextResponse.redirect(`${url.origin}/setup`);
    }

    // 3. Check MFA Verification
    const { data: mfaData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
      mfaData &&
      mfaData.nextLevel === "aal2" &&
      mfaData.nextLevel !== mfaData.currentLevel &&
      newUrl.pathname !== "/mfa/verify"
    ) {
      // Redirect to MFA verification if needed and not already there
      return NextResponse.redirect(`${url.origin}/mfa/verify`);
    }
  }

  // If all checks pass, return the original or updated response
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
