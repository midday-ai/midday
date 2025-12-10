import { createClient } from "@midday/supabase/client";

/**
 * Creates an authenticated URL by appending the access token as a query parameter.
 * Useful for resources that can't send Authorization headers (like img tags).
 */
export async function getAuthenticatedUrl(baseUrl: string): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No session found");
  }

  const url = new URL(baseUrl);
  url.searchParams.set("token", session.access_token);
  return url.toString();
}
