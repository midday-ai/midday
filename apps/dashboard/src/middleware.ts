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
    !newUrl.pathname.includes("/s/") &&
    !newUrl.pathname.includes("/verify") &&
    !newUrl.pathname.includes("/all-done") &&
    !newUrl.pathname.includes("/desktop/search")
  ) {
    const url = new URL("/login", request.url);

    if (encodedSearchParams) {
      url.searchParams.append("return_to", encodedSearchParams);
    }

    return NextResponse.redirect(url);
  }

  // If authenticated, proceed with other checks
  if (session) {
    if (newUrl.pathname !== "/teams/create" && newUrl.pathname !== "/teams") {
      // Check if the URL contains an invite code
      const inviteCodeMatch = newUrl.pathname.startsWith("/teams/invite/");

      if (inviteCodeMatch) {
        // Allow proceeding to invite page even without setup
        // Redirecting with the original path including locale if present
        return NextResponse.redirect(
          `${url.origin}${request.nextUrl.pathname}`,
        );
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
      const url = new URL("/mfa/verify", request.url);

      if (encodedSearchParams) {
        url.searchParams.append("return_to", encodedSearchParams);
      }

      // Redirect to MFA verification if needed and not already there
      return NextResponse.redirect(url);
    }
  }

  const localeCookie = response.cookies.get("Next-Locale");
  if (localeCookie) {
    response.cookies.set("Next-Locale", localeCookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only enforce Secure in production
      sameSite: "lax",
      path: "/",
    });
  }

  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // If all checks pass, return the original or updated response
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
