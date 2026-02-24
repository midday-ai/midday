import { updateSession } from "@midday/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

const ORIGIN = process.env.NEXT_PUBLIC_URL || "http://localhost:3001";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  const { response, session, supabase } = await updateSession(
    request,
    I18nMiddleware(request),
  );

  const nextUrl = request.nextUrl;

  const pathnameLocale = nextUrl.pathname.split("/", 2)?.[1];

  const pathnameWithoutLocale = pathnameLocale
    ? nextUrl.pathname.slice(pathnameLocale.length + 1)
    : nextUrl.pathname;

  const newUrl = new URL(pathnameWithoutLocale || "/", ORIGIN);

  const encodedSearchParams = `${newUrl?.pathname?.substring(1)}${
    newUrl.search
  }`;

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

  if (session) {
    if (newUrl.pathname !== "/onboarding" && newUrl.pathname !== "/teams") {
      const inviteCodeMatch = newUrl.pathname.startsWith("/teams/invite/");

      if (inviteCodeMatch) {
        return NextResponse.redirect(`${ORIGIN}${request.nextUrl.pathname}`);
      }
    }

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

      return NextResponse.redirect(mfaUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
