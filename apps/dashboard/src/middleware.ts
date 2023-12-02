import { createClient } from "@midday/supabase/middleware";
import { get } from "@vercel/edge-config";
import { createI18nMiddleware } from "next-international/middleware";
import { NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "sv"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  const response = I18nMiddleware(request);
  const { supabase } = createClient(request, response);

  const { data } = await supabase.auth.getSession();

  if (!data.session && request.nextUrl.pathname !== "/") {
    const url = new URL("/", request.url);
    const encodedSearchParams = encodeURIComponent(
      `${request.nextUrl.pathname.substring(1)}${request.nextUrl.search}`
    );

    url.searchParams.append("return_to", encodedSearchParams);

    return NextResponse.redirect(url);
  }

  if (
    data.session &&
    !(await get("beta"))?.includes(data.session.user.id) &&
    request.nextUrl.pathname !== "/closed"
  ) {
    return NextResponse.redirect(new URL("/closed", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
