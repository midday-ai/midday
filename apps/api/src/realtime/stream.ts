import { isLocalBackend } from "@midday/utils/backend";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { decodeJwt } from "jose";
import type { ChangeEvent } from "./listener-core";

type StreamDependencies = {
  verifyToken: (token: string) => Promise<{ user: { id: string } } | null>;
  resolveTeam: (userId: string) => Promise<string | null>;
  subscribe: (
    identity: { teamId: string; userId: string },
    callback: (event: ChangeEvent) => void,
  ) => () => void;
  heartbeatMs?: number;
  maxDurationMs?: number;
};
export function createRealtimeRouter(dependencies: StreamDependencies) {
  const router = new Hono();
  router.get("/stream", async (c) => {
    if (!isLocalBackend()) return c.json({ error: "Not found" }, 404);
    const token = /^Bearer ([^\s]+)$/.exec(
      c.req.header("Authorization") ?? "",
    )?.[1];
    if (!token) return c.json({ error: "Unauthorized" }, 401);
    const session = await dependencies.verifyToken(token);
    if (!session?.user.id) return c.json({ error: "Unauthorized" }, 401);
    let expiresAt: number;
    try {
      // Decode expiry only after signature, issuer and audience verification.
      const { exp } = decodeJwt(token);
      if (typeof exp !== "number" || !Number.isFinite(exp))
        throw new Error("Missing expiry");
      expiresAt = exp * 1_000;
    } catch {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const teamId = await dependencies.resolveTeam(session.user.id);
    if (!teamId)
      return c.json({ error: "No permission to access this team" }, 403);
    const duration = Math.min(
      expiresAt - Date.now(),
      dependencies.maxDurationMs ?? 600_000,
    );
    if (duration <= 0) return c.json({ error: "Unauthorized" }, 401);
    c.header("X-Accel-Buffering", "no");
    return streamSSE(c, async (stream) => {
      let finish!: () => void;
      const done = new Promise<void>((resolve) => {
        finish = resolve;
      });
      let stopped = false;
      let queued = 0;
      let pending = Promise.resolve();
      const stop = () => {
        if (!stopped) {
          stopped = true;
          finish();
          stream.abort();
        }
      };
      const write = (operation: () => Promise<unknown>) => {
        if (stopped) return;
        // Bound slow-reader memory; reconnect obtains a fresh session.
        if (++queued > 100) {
          stop();
          return;
        }
        pending = pending
          .then(async () => {
            if (!stopped) await operation();
          })
          .catch(stop)
          .finally(() => {
            queued--;
          });
      };
      stream.onAbort(stop);
      c.req.raw.signal.addEventListener("abort", stop, { once: true });
      const unsubscribe = dependencies.subscribe(
        { teamId, userId: session.user.id },
        (event) => {
          write(() =>
            stream.writeSSE({
              event: "change",
              data: JSON.stringify({
                table: event.table,
                eventType: event.type,
                team_id: event.team_id,
                user_id: event.user_id,
                new: event.new,
                old: event.old,
              }),
            }),
          );
        },
      );
      const heartbeat = setInterval(
        () => write(() => stream.write(": heartbeat\n\n")),
        dependencies.heartbeatMs ?? 25_000,
      );
      const expiration = setTimeout(stop, duration);
      write(() => stream.write(": connected\n\n"));
      if (c.req.raw.signal.aborted) stop();
      try {
        await done;
      } finally {
        clearInterval(heartbeat);
        clearTimeout(expiration);
        unsubscribe();
        c.req.raw.signal.removeEventListener("abort", stop);
      }
    });
  });
  return router;
}
