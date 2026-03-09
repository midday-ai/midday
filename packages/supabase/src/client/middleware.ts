import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

// getClaims() validates the JWT and refreshes expired tokens.
// The refresh involves a network call to Supabase Auth which can hang
// if the service is slow or unreachable.
const SESSION_REFRESH_TIMEOUT_MS = 5_000;

export async function updateSession(
  request: NextRequest,
  response: NextResponse,
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims().
  // See: https://supabase.com/docs/guides/auth/server-side/nextjs
  //
  // getClaims() validates the JWT signature against the project's published
  // JWKS and refreshes expired tokens. This replaces the old getSession()
  // pattern which was not guaranteed to revalidate the Auth token and could
  // cause random logouts.
  let isAuthenticated = false;
  try {
    const { data, error } = await Promise.race([
      supabase.auth.getClaims(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("session refresh timeout")),
          SESSION_REFRESH_TIMEOUT_MS,
        ),
      ),
    ]);
    isAuthenticated = !!data && !error;
  } catch {
    // Timeout or refresh failure → treat as unauthenticated.
    // The middleware caller will redirect to /login.
  }

  return {
    response,
    isAuthenticated,
    supabase,
  };
}
