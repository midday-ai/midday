import { afterEach, describe, expect, test } from "bun:test";
import {
  subscribeSupabase,
  subscribeUsingBackend,
} from "../../../../dashboard/src/lib/realtime-provider";
import { createRealtimeRouter } from "../stream";

const previous = process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
afterEach(() => {
  if (previous === undefined) delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  else process.env.NEXT_PUBLIC_BACKEND_PROVIDER = previous;
});
const token = (exp = Math.floor(Date.now() / 1000) + 900) =>
  `eyJhbGciOiJFZERTQSJ9.${Buffer.from(JSON.stringify({ sub: "user-a", exp })).toString("base64url")}.signature`;
describe("realtime provider selection and stream lifecycle", () => {
  test("unset provider preserves Supabase events, filters and unsubscribe", () => {
    delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
    let subscribed = 0;
    let removed = 0;
    const names: string[] = [];
    const bindings: {
      filter: unknown;
      callback: (payload: unknown) => unknown;
    }[] = [];
    const channel = {
      on(
        _kind: string,
        filter: unknown,
        callback: (payload: unknown) => unknown,
      ) {
        bindings.push({ filter, callback });
        return this;
      },
      subscribe() {
        subscribed++;
        return this;
      },
    };
    const client = {
      channel(name: string) {
        names.push(name);
        return channel;
      },
      async removeChannel(value: unknown) {
        expect(value).toBe(channel);
        removed++;
        return "ok";
      },
    } as unknown as Parameters<typeof subscribeSupabase>[0];
    const received: unknown[] = [];
    const stop = subscribeUsingBackend({
      supabase: () =>
        subscribeSupabase(client, {
          channelName: "legacy",
          table: "inbox",
          events: ["INSERT", "UPDATE"],
          filter: "team_id=eq.team-a",
          onEvent: (payload) => received.push(payload),
        }),
      local: () => {
        throw new Error("SSE must stay unused");
      },
    });
    expect(subscribed).toBe(1);
    expect(names[0]).toMatch(/^legacy:[a-z0-9]+$/);
    expect(bindings.map((binding) => binding.filter)).toEqual([
      {
        event: "INSERT",
        schema: "public",
        table: "inbox",
        filter: "team_id=eq.team-a",
      },
      {
        event: "UPDATE",
        schema: "public",
        table: "inbox",
        filter: "team_id=eq.team-a",
      },
    ]);
    const payload = {
      eventType: "UPDATE",
      new: { status: "done" },
      old: { status: "processing" },
    };
    bindings[1]!.callback(payload);
    expect(received).toEqual([payload]);
    stop();
    expect(removed).toBe(1);
  });
  test("explicit local profile never creates a Supabase channel", () => {
    process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
    let stopped = false;
    subscribeUsingBackend({
      supabase: () => {
        throw new Error("Unused Supabase");
      },
      local: () => () => {
        stopped = true;
      },
    })();
    expect(stopped).toBe(true);
  });
  test("Supabase disables SSE before verifier, DB or LISTEN access", async () => {
    delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
    const app = createRealtimeRouter({
      verifyToken: async () => {
        throw new Error("Unused verifier");
      },
      resolveTeam: async () => {
        throw new Error("Unused DB");
      },
      subscribe: () => {
        throw new Error("Unused listener");
      },
    });
    expect(
      (
        await app.request("/stream", {
          headers: { Authorization: "Bearer fake" },
        })
      ).status,
    ).toBe(404);
  });
  test("local requires Bearer auth, selected team membership and expiry", async () => {
    process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
    let team: string | null = null;
    const validToken = token();
    const app = createRealtimeRouter({
      verifyToken: async (value) =>
        value === validToken ? { user: { id: "user-a" } } : null,
      resolveTeam: async () => team,
      subscribe: () => () => {},
      maxDurationMs: 5,
    });
    expect(
      (await app.request(`/stream?token=${validToken}&teamId=team-a`)).status,
    ).toBe(401);
    expect(
      (
        await app.request("/stream", {
          headers: { Authorization: "Bearer bad" },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await app.request("/stream?teamId=team-a", {
          headers: { Authorization: `Bearer ${validToken}` },
        })
      ).status,
    ).toBe(403);
    team = "team-a";
    const response = await app.request("/stream?teamId=team-b", {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("x-accel-buffering")).toBe("no");
    await response.body?.cancel();
    const permissive = createRealtimeRouter({
      verifyToken: async () => ({ user: { id: "user-a" } }),
      resolveTeam: async () => "team-a",
      subscribe: () => () => {},
    });
    expect(
      (
        await permissive.request("/stream", {
          headers: { Authorization: `Bearer ${token(1)}` },
        })
      ).status,
    ).toBe(401);
  });
  test("stream expiration sends heartbeats and releases subscriber", async () => {
    process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
    let removed = false;
    const app = createRealtimeRouter({
      verifyToken: async () => ({ user: { id: "user-a" } }),
      resolveTeam: async () => "team-a",
      subscribe: () => () => {
        removed = true;
      },
      heartbeatMs: 5,
      maxDurationMs: 30,
    });
    const response = await app.request("/stream", {
      headers: { Authorization: `Bearer ${token()}` },
    });
    const body = await response.text();
    expect(body).toContain(": connected");
    expect(body).toContain(": heartbeat");
    expect(removed).toBe(true);
  });
});
