import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(
  request: NextRequest,
  response: NextResponse,
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          // Re-create the response so it picks up the mutated request cookies.
          // This mirrors the pattern from the Supabase SSR docs.
          const nextResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            nextResponse.cookies.set(name, value, options);
          }

          // Copy updated cookies onto the original response object so the
          // caller (middleware.ts) can continue adding headers/redirects to it.
          for (const cookie of nextResponse.cookies.getAll()) {
            response.cookies.set(cookie.name, cookie.value);
          }
        },
      },
    },
  );

  if (supabase.auth) {
    // @ts-expect-error - suppressGetSessionWarning is protected
    supabase.auth.suppressGetSessionWarning = true;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    response,
    session,
    supabase,
  };
}
