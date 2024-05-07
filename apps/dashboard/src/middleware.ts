import { updateSession } from "@midday/supabase/middleware";
import { createClient } from "@midday/supabase/server";
import { addYears, isAfter, isBefore } from "date-fns";
import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  const response = await updateSession(request, I18nMiddleware(request));
  const supabase = createClient();
  const url = new URL("/", request.url);
  const nextUrl = request.nextUrl;

  const pathnameLocale = nextUrl.pathname.split("/", 2)?.[1];

  // Remove the locale from the pathname
  const pathnameWithoutLocale = nextUrl.pathname.slice(
    pathnameLocale.length + 1
  );

  // Create a new URL without the locale in the pathname
  const newUrl = new URL(pathnameWithoutLocale || "/", request.url);

  const { data } = await supabase.auth.getUser();

  // Not authenticated
  if (
    !data?.user &&
    newUrl.pathname !== "/" &&
    !newUrl.pathname.includes("/report") &&
    !newUrl.pathname.includes("/unsubscribe") &&
    !newUrl.pathname.includes("/setup")
  ) {
    const encodedSearchParams = `${newUrl.pathname.substring(1)}${
      newUrl.search
    }`;

    url.searchParams.append("return_to", encodedSearchParams);

    return NextResponse.redirect(url);
  }

  const invited = request.cookies.has("invite");
  const inviteCode = nextUrl.searchParams.get("invite");

  if (!invited && inviteCode) {
    response.cookies.set("invite", inviteCode, {
      expires: addYears(new Date(), 1),
    });
  }

  const checkPath = data?.user && newUrl.pathname === "/";

  if (
    // If user is registred before date
    (checkPath &&
      !isBefore(new Date(data.user.created_at), new Date("2024-05-08")) &&
      !invited) ||
    (checkPath &&
      isAfter(new Date(data.user.created_at), new Date("2024-05-08")) &&
      !invited)
  ) {
    return NextResponse.redirect(new URL("/closed", request.url));
  }

  // If authenticated but no full_name redirect to user setup page
  if (
    newUrl.pathname !== "/setup" &&
    data?.user &&
    !data?.user?.user_metadata?.full_name
  ) {
    return NextResponse.redirect(`${url.origin}/setup`);
  }

  const { data: mfaData } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  // Enrolled for mfa but not verified
  if (
    mfaData &&
    mfaData.nextLevel === "aal2" &&
    mfaData.nextLevel !== mfaData.currentLevel &&
    newUrl.pathname !== "/mfa/verify"
  ) {
    return NextResponse.redirect(`${url.origin}/mfa/verify`);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
