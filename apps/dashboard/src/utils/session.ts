import { authClient } from "@midday/auth/client";
import { createClient } from "@midday/supabase/client";
import { isLocalBackend } from "@midday/utils/backend";

let cached: { token: string; expiresAt: number } | null = null;
let pending: Promise<string | null> | null = null;
let revision = 0;

export function clearAccessToken() {
  revision++;
  cached = null;
  pending = null;
}

// Better Auth emits this signal for sign-in/out and cross-tab updates.
if (isLocalBackend())
  authClient.$store.listen("$sessionSignal", clearAccessToken);
if (isLocalBackend() && typeof window !== "undefined") {
  let sessionId: string | undefined;
  let initialized = false;
  authClient.$store.atoms.session?.subscribe(({ data, isPending }) => {
    if (isPending) return;
    if (!initialized) {
      initialized = true;
      sessionId = data?.session.id;
      return;
    }
    if (data?.session.id !== sessionId) {
      sessionId = data?.session.id;
      clearAccessToken();
    }
  });
}

export async function getAccessToken(): Promise<string | null> {
  if (!isLocalBackend())
    return (
      (await createClient().auth.getSession()).data.session?.access_token ??
      null
    );
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  if (pending) return pending;
  const startedAt = revision;
  const request = (async () => {
    try {
      const { data, error } = await authClient.token();
      // Session hydration or a cross-tab sign-in can invalidate an in-flight
      // token. Fetch the current session's token instead of sending an anonymous
      // request, which would make protected queries sign the user out.
      if (startedAt !== revision) return getAccessToken();
      if (error || !data?.token) return null;
      const payload = data.token.split(".")[1];
      if (!payload) return null;
      const { exp } = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (typeof exp !== "number" || exp * 1000 <= Date.now()) return null;
      cached = { token: data.token, expiresAt: exp * 1000 };
      return data.token;
    } catch {
      return null;
    } finally {
      if (startedAt === revision) pending = null;
    }
  })();
  pending = request;
  return request;
}
