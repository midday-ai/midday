import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../types";

type CreateClientOptions = {
  admin?: boolean;
  schema?: "public" | "storage";
};

export async function createClient(options?: CreateClientOptions) {
  const { admin = false, ...rest } = options ?? {};
  const cookieStore = await cookies();

  const key = admin
    ? process.env.SUPABASE_SECRET_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  const auth = admin
    ? {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    : {};

  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      ...rest,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth,
    },
  );

  // The middleware validates and refreshes tokens via getClaims().
  // Server components only call getSession() to read the access token
  // from cookies — suppress the "use getUser() instead" warning.
  // @ts-expect-error - suppressGetSessionWarning is a protected property
  client.auth.suppressGetSessionWarning = true;

  return client;
}
