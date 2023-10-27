import { createClient } from "@midday/supabase/server";
import { createI18nMiddleware } from "next-international/middleware";
import { NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "sv"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(req: NextRequest) {
  const res = I18nMiddleware(req);
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session && req.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
