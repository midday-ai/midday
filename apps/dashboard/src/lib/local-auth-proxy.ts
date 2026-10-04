import { getAuth } from "@midday/auth/server";
import { type NextRequest, NextResponse } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

const ORIGIN = process.env.NEXT_PUBLIC_URL || "http://localhost:3001";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function proxy(request: NextRequest) {
  const auth = await getAuth();
  const response = I18nMiddleware(request);
  const session = await auth.api.getSession({
    headers: request.headers,
    query: { disableCookieCache: true },
  });
  const isAuthenticated = !!session;

  const nextUrl = request.nextUrl;

  const pathnameLocale =
    nextUrl.pathname.split("/", 2)?.[1] === "en" ? "en" : undefined;

  const pathnameWithoutLocale = pathnameLocale
    ? nextUrl.pathname.slice(pathnameLocale.length + 1)
    : nextUrl.pathname;

  const newUrl = new URL(pathnameWithoutLocale || "/", ORIGIN);

  const encodedSearchParams = `${newUrl?.pathname?.substring(1)}${
    nextUrl.search
  }`;

  if (
    !isAuthenticated &&
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

  if (isAuthenticated) {
    if (
      session.user.twoFactorEnabled &&
      session.session.aal !== "aal2" &&
      newUrl.pathname !== "/mfa/verify"
    ) {
      const mfaUrl = new URL("/mfa/verify", ORIGIN);
      if (encodedSearchParams)
        mfaUrl.searchParams.set("return_to", encodedSearchParams);
      return NextResponse.redirect(mfaUrl);
    }
    if (newUrl.pathname !== "/onboarding" && newUrl.pathname !== "/teams") {
      const inviteCodeMatch = newUrl.pathname.startsWith("/teams/invite/");

      if (inviteCodeMatch) {
        return NextResponse.redirect(`${ORIGIN}${request.nextUrl.pathname}`);
      }
    }
  }

  return response;
}
