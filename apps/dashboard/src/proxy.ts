import { createClient } from "@midday/supabase/server";
import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

// Public paths that don't require authentication (exact matches and prefixes)
const PUBLIC_EXACT = new Set(["/login", "/verify", "/oauth-callback"]);
const PUBLIC_PREFIXES = ["/i/", "/p/", "/s/", "/r/", "/desktop/search"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const response = I18nMiddleware(request);
  const { pathname, search } = request.nextUrl;

  // Strip locale prefix if present (e.g., /en/dashboard -> /dashboard)
  const pathWithoutLocale = pathname.startsWith("/en/")
    ? pathname.slice(3)
    : pathname;

  // Early return for public paths - skip all auth logic
  if (isPublicPath(pathWithoutLocale)) {
    response.headers.set("x-pathname", pathWithoutLocale);
    return response;
  }

  // Get session from Supabase
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Not authenticated - redirect to login
  if (!session) {
    const returnTo = `${pathWithoutLocale.substring(1)}${search}`;
    const loginUrl = new URL("/login", request.url);
    if (returnTo) {
      loginUrl.searchParams.append("return_to", returnTo);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Handle team invite paths
  if (pathWithoutLocale.startsWith("/teams/invite/")) {
    return NextResponse.redirect(new URL(pathname, request.url));
  }

  // Check MFA verification status
  if (pathWithoutLocale !== "/mfa/verify") {
    const { data: mfaData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (
      mfaData?.nextLevel === "aal2" &&
      mfaData.nextLevel !== mfaData.currentLevel
    ) {
      const returnTo = `${pathWithoutLocale.substring(1)}${search}`;
      const mfaUrl = new URL("/mfa/verify", request.url);
      if (returnTo) {
        mfaUrl.searchParams.append("return_to", returnTo);
      }
      return NextResponse.redirect(mfaUrl);
    }
  }

  response.headers.set("x-pathname", pathWithoutLocale);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
