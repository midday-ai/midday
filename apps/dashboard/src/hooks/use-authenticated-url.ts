import { createClient } from "@midday/supabase/client";
import { useEffect, useMemo, useState } from "react";

/**
 * Hook to get an authenticated URL by appending the access token as a query parameter.
 * Useful for resources that can't send Authorization headers (like img tags).
 *
 * @param baseUrl - The base URL to append the token to
 * @returns Object with `url` (authenticated URL), `isLoading`, and `error` state
 */
export function useAuthenticatedUrl(baseUrl: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!baseUrl) {
      setUrl(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Get session immediately
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!session?.access_token) {
          setError(new Error("No session found"));
          setIsLoading(false);
          return;
        }
        const authenticatedUrl = new URL(baseUrl);
        authenticatedUrl.searchParams.set("token", session.access_token);
        setUrl(authenticatedUrl.toString());
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to get session:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to get session"),
        );
        setIsLoading(false);
      });
  }, [baseUrl, supabase]);

  return { url, isLoading, error };
}
