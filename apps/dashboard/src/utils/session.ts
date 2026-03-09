import { createClient } from "@midday/supabase/client";

// Avoid calling getSession() on every tRPC request. In Chrome, getSession()
// uses navigator.locks (_acquireLock) to serialize token refreshes across tabs.
// When multiple tRPC requests fire concurrently and the token needs refreshing,
// every request queues behind the lock and the dashboard freezes.
// Safari doesn't use navigator.locks, which is why it doesn't hang.
// See: https://github.com/supabase/supabase-js/issues/2013
//
// Instead we subscribe to onAuthStateChange once. The INITIAL_SESSION event
// delivers the current session (internally one getSession() call), and
// TOKEN_REFRESHED keeps the cached token up to date automatically.
// This reduces lock contention from N-concurrent-requests to a single init call.
//
// A timeout guard prevents the dashboard from hanging forever if
// INITIAL_SESSION never fires (e.g. navigator.locks deadlock in Chrome
// when returning to a stale tab). After the timeout, requests proceed
// with a null token → 401 → the QueryCache onError handler redirects to /login.

const SESSION_INIT_TIMEOUT_MS = 5_000;

let cachedAccessToken: string | null = null;
let sessionReady: Promise<void> | null = null;

function ensureInitialized() {
  if (sessionReady) return;

  const supabase = createClient();

  const authReady = new Promise<void>((resolve) => {
    supabase.auth.onAuthStateChange((event, session) => {
      cachedAccessToken = session?.access_token ?? null;

      if (event === "INITIAL_SESSION") {
        resolve();
      }
    });
  });

  const timeout = new Promise<void>((resolve) => {
    setTimeout(() => {
      console.warn(
        "[session] INITIAL_SESSION did not fire within timeout – " +
          "likely navigator.locks contention. Proceeding with null token.",
      );
      resolve();
    }, SESSION_INIT_TIMEOUT_MS);
  });

  sessionReady = Promise.race([authReady, timeout]);
}

export function initSessionCache() {
  ensureInitialized();
}

export async function getAccessToken(): Promise<string | null> {
  ensureInitialized();
  await sessionReady;
  return cachedAccessToken;
}
