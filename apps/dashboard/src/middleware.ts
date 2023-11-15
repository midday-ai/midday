import { createClient } from "@midday/supabase/middleware";
import { createI18nMiddleware } from "next-international/middleware";
import { NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "sv"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

const ADMINS = [
  "ec10c095-8cf7-4ba3-a62e-98f2a3d40c4c",
  "7d723617-c2e1-4b71-8bf4-fb02479b264a",
  "efea0311-0786-4f70-9b5a-63e3efa5d319",
  "2f76981b-fc66-479c-8203-521a5a1f734a",
  "3cb7ad12-907e-49c6-9f3a-ea3eeb1d34cf",
  "71908de2-2727-43a8-8a3f-4ae203faa4c5",
  "a9f6e6f2-8d58-4cf7-a3e7-312be3ee9560", // Ali Saheli
];

export async function middleware(request: NextRequest) {
  const response = I18nMiddleware(request);
  const { supabase } = createClient(request, response);

  const { data } = await supabase.auth.getSession();

  if (!data.session && request.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    data.session &&
    !ADMINS.includes(data.session.user.id) &&
    request.nextUrl.pathname !== "/closed"
  ) {
    return NextResponse.redirect(new URL("/closed", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
