import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

type TokenReply = {
  data: { token: string } | null;
  error: { message: string } | null;
};
type SessionState = {
  data: { session: { id: string } } | null;
  isPending: boolean;
};
const replies: Promise<TokenReply>[] = [];
const signals: (() => void)[] = [];
const sessionObservers: ((state: SessionState) => void)[] = [];
const localToken = mock(() => {
  const reply = replies.shift();
  if (!reply) throw new Error("Unexpected local token request");
  return reply;
});
let supabaseToken: string | null = "supabase-session-token";
const supabaseSession = mock(async () => ({
  data: {
    session: supabaseToken ? { access_token: supabaseToken } : null,
  },
}));
mock.module("@midday/auth/client", () => ({
  authClient: {
    token: localToken,
    $store: {
      listen: (name: string, callback: () => void) => {
        expect(name).toBe("$sessionSignal");
        signals.push(callback);
      },
      atoms: {
        session: {
          subscribe: (callback: (state: SessionState) => void) => {
            sessionObservers.push(callback);
          },
        },
      },
    },
  },
}));
mock.module("@midday/supabase/client", () => ({
  createClient: () => ({ auth: { getSession: supabaseSession } }),
}));

const previousProvider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
beforeEach(() => {
  replies.length = 0;
  localToken.mockClear();
  supabaseSession.mockClear();
  supabaseToken = "supabase-session-token";
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });
});
afterEach(() => {
  if (previousProvider === undefined)
    delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  else process.env.NEXT_PUBLIC_BACKEND_PROVIDER = previousProvider;
  if (previousWindow)
    Object.defineProperty(globalThis, "window", previousWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

async function loadSession(provider: "local" | "supabase" = "local") {
  if (provider === "local") process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
  else delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  const session = await import("./session");
  // Exercise the real invalidation API between scenarios, keeping SDK listeners.
  session.clearAccessToken();
  return session;
}
function deferred() {
  let resolve!: (reply: TokenReply) => void;
  const promise = new Promise<TokenReply>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function token(label: string, seconds = 900) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: label,
      exp: Math.floor(Date.now() / 1000) + seconds,
    }),
  ).toString("base64url");
  return `eyJhbGciOiJFZERTQSJ9.${payload}.fixture-signature`;
}
function success(token: string): TokenReply {
  return { data: { token }, error: null };
}

describe("access token session invalidation", () => {
  test("session hydration replaces an in-flight token instead of returning null", async () => {
    const session = await loadSession();
    const old = deferred();
    const current = deferred();
    replies.push(old.promise, current.promise);
    const staleToken = token("before-hydration");
    const currentToken = token("current-session");
    sessionObservers[0]!({ data: null, isPending: false });
    const request = session.getAccessToken();
    sessionObservers[0]!({
      data: { session: { id: "signed-in-session" } },
      isPending: false,
    });
    old.resolve(success(staleToken));
    current.resolve(success(currentToken));
    expect(await request).toBe(currentToken);
    expect(localToken).toHaveBeenCalledTimes(2);
    expect(await session.getAccessToken()).toBe(currentToken);
    expect(localToken).toHaveBeenCalledTimes(2);
  });

  test("stale request joins a newer pending request and cannot clear it or cycle", async () => {
    const session = await loadSession();
    const old = deferred();
    const current = deferred();
    replies.push(old.promise, current.promise);
    const first = session.getAccessToken();
    signals[0]!();
    const second = session.getAccessToken();
    old.resolve(success(token("stale-session")));
    // Let the old request reach its revision check/finally while the new one waits.
    await Promise.resolve();
    await Promise.resolve();
    const third = session.getAccessToken();
    expect(localToken).toHaveBeenCalledTimes(2);
    const currentToken = token("new-session");
    current.resolve(success(currentToken));
    expect(await Promise.all([first, second, third])).toEqual([
      currentToken,
      currentToken,
      currentToken,
    ]);
    expect(await session.getAccessToken()).toBe(currentToken);
    expect(localToken).toHaveBeenCalledTimes(2);
  });

  test("an obsolete error response retries the current session before handling error", async () => {
    const session = await loadSession();
    const old = deferred();
    const currentToken = token("after-sign-in");
    replies.push(old.promise, Promise.resolve(success(currentToken)));
    const request = session.getAccessToken();
    signals[0]!();
    old.resolve({ data: null, error: { message: "Old session expired" } });
    expect(await request).toBe(currentToken);
    expect(localToken).toHaveBeenCalledTimes(2);
  });

  test("repeated invalidations resolve every caller with the latest token", async () => {
    const session = await loadSession();
    const old = deferred();
    const intermediate = deferred();
    const latest = deferred();
    replies.push(old.promise, intermediate.promise, latest.promise);
    const first = session.getAccessToken();
    signals[0]!();
    const second = session.getAccessToken();
    signals[0]!();
    const third = session.getAccessToken();
    const currentToken = token("latest-session");
    old.resolve(success(token("old")));
    intermediate.resolve(success(token("intermediate")));
    latest.resolve(success(currentToken));
    expect(await Promise.all([first, second, third])).toEqual([
      currentToken,
      currentToken,
      currentToken,
    ]);
    expect(localToken).toHaveBeenCalledTimes(3);
  });

  test("expired tokens are rejected and tokens near expiry are never reused from cache", async () => {
    const session = await loadSession();
    const nearExpiry = token("near-expiry", 30);
    const valid = token("fresh");
    replies.push(
      Promise.resolve(success(token("expired", -10))),
      Promise.resolve(success(nearExpiry)),
      Promise.resolve(success(valid)),
    );
    expect(await session.getAccessToken()).toBeNull();
    expect(await session.getAccessToken()).toBe(nearExpiry);
    expect(await session.getAccessToken()).toBe(valid);
    expect(await session.getAccessToken()).toBe(valid);
    expect(localToken).toHaveBeenCalledTimes(3);
  });

  test("a current-session SDK error returns null and does not poison subsequent requests", async () => {
    const session = await loadSession();
    const valid = token("recovered-session");
    replies.push(
      Promise.resolve({ data: null, error: { message: "No session" } }),
      Promise.resolve(success(valid)),
    );
    expect(await session.getAccessToken()).toBeNull();
    expect(await session.getAccessToken()).toBe(valid);
    expect(localToken).toHaveBeenCalledTimes(2);
  });

  test("Supabase remains the default and delegates without local token/store access", async () => {
    const session = await loadSession("supabase");
    const registeredSignals = signals.length;
    const registeredObservers = sessionObservers.length;
    expect(await session.getAccessToken()).toBe("supabase-session-token");
    supabaseToken = "refreshed-supabase-token";
    expect(await session.getAccessToken()).toBe("refreshed-supabase-token");
    supabaseToken = null;
    expect(await session.getAccessToken()).toBeNull();
    expect(supabaseSession).toHaveBeenCalledTimes(3);
    expect(localToken).not.toHaveBeenCalled();
    expect(signals).toHaveLength(registeredSignals);
    expect(sessionObservers).toHaveLength(registeredObservers);
  });
});
