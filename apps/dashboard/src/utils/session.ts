import { createClient } from "@midday/supabase/client";

// Avoid calling getSession() on every tRPC request. In Chrome, getSession()
// uses navigator.locks (_acquireLock) to serialize token refreshes across tabs.
// When multiple tRPC requests fire concurrently and the token needs refreshing,
// every request queues behind the lock and the dashboard freezes.
// Safari doesn't use navigator.locks, which is why it doesn't hang.
// See: https://github.com/supabase/supabase-js/issues/2013

let cachedAccessToken: string | null = null;
let tokenInitialized = false;
let refreshPromise: Promise<string | null> | null = null;

const TOKEN_EXPIRY_MARGIN_MS = 60_000;

function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!));
    return payload.exp * 1000 < Date.now() + TOKEN_EXPIRY_MARGIN_MS;
  } catch {
    return true;
  }
}

export function initSessionCache() {
  if (tokenInitialized) return;
  tokenInitialized = true;

  const supabase = createClient();

  supabase.auth.getSession().then(({ data: { session } }) => {
    cachedAccessToken = session?.access_token ?? null;
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedAccessToken = session?.access_token ?? null;
  });
}

export async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken && !isTokenExpiringSoon(cachedAccessToken)) {
    return cachedAccessToken;
  }

  // Deduplicate: if a refresh is already in-flight, all callers share it
  // instead of each acquiring navigator.locks independently.
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        cachedAccessToken = session?.access_token ?? null;
        return cachedAccessToken;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}
