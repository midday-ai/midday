import { updateSession } from "@midday/supabase/middleware";
import { createClient } from "@midday/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

const ORIGIN = process.env.NEXT_PUBLIC_URL || "http://localhost:3001";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  const response = await updateSession(request, I18nMiddleware(request));
  const supabase = await createClient();
  const nextUrl = request.nextUrl;

  const pathnameLocale = nextUrl.pathname.split("/", 2)?.[1];

  // Remove the locale from the pathname
  const pathnameWithoutLocale = pathnameLocale
    ? nextUrl.pathname.slice(pathnameLocale.length + 1)
    : nextUrl.pathname;

  // Create a new URL without the locale in the pathname
  const newUrl = new URL(pathnameWithoutLocale || "/", ORIGIN);

  const encodedSearchParams = `${newUrl?.pathname?.substring(1)}${
    newUrl.search
  }`;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 1. Not authenticated
  if (
    !session &&
    newUrl.pathname !== "/login" &&
    !newUrl.pathname.includes("/i/") &&
    !newUrl.pathname.includes("/p/") &&
    !newUrl.pathname.includes("/s/") &&
    !newUrl.pathname.includes("/r/") &&
    !newUrl.pathname.includes("/verify") &&
    !newUrl.pathname.includes("/oauth-callback") &&
    !newUrl.pathname.includes("/desktop/search")
  ) {
    const loginUrl = new URL("/login", ORIGIN);

    if (encodedSearchParams) {
      loginUrl.searchParams.append("return_to", encodedSearchParams);
    }

    return NextResponse.redirect(loginUrl);
  }

  // If authenticated, proceed with other checks
  if (session) {
    if (newUrl.pathname !== "/onboarding" && newUrl.pathname !== "/teams") {
      // Check if the URL contains an invite code
      const inviteCodeMatch = newUrl.pathname.startsWith("/teams/invite/");

      if (inviteCodeMatch) {
        // Allow proceeding to invite page even without setup
        return NextResponse.redirect(`${ORIGIN}${request.nextUrl.pathname}`);
      }
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
      const mfaUrl = new URL("/mfa/verify", ORIGIN);

      if (encodedSearchParams) {
        mfaUrl.searchParams.append("return_to", encodedSearchParams);
      }

      // Redirect to MFA verification if needed and not already there
      return NextResponse.redirect(mfaUrl);
    }
  }

  // If all checks pass, return the original or updated response
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
