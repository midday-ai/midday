import type { Session } from "@api/utils/auth";
import { replicationCache } from "@midday/cache/replication-cache";
import type { Database, DatabaseWithPrimary } from "@midday/db/client";
import { createLoggerWithContext } from "@midday/logger";

const DEBUG_PERF = process.env.DEBUG_PERF === "true";
const perfLogger = createLoggerWithContext("perf:trpc");

export const withPrimaryReadAfterWrite = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    teamId?: string | null;
    db: Database;
    forcePrimary?: boolean;
  };
  type: "query" | "mutation" | "subscription";
  next: (opts: {
    ctx: {
      session?: Session | null;
      teamId?: string | null;
      db: Database;
      forcePrimary?: boolean;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, type, next } = opts;
  const teamId = ctx.teamId;
  const forcePrimary = ctx.forcePrimary;

  if (forcePrimary && type !== "mutation") {
    const dbWithPrimary = ctx.db as DatabaseWithPrimary;
    if (dbWithPrimary.usePrimaryOnly) {
      ctx.db = dbWithPrimary.usePrimaryOnly();
    }
    return next({ ctx });
  }

  let routedToPrimary = false;
  let routeReason = "";

  if (teamId) {
    if (type === "mutation") {
      const cacheStart = DEBUG_PERF ? performance.now() : 0;
      await replicationCache.set(teamId);
      if (DEBUG_PERF) {
        perfLogger.info("replicationCache.set", {
          cacheMs: +(performance.now() - cacheStart).toFixed(2),
          teamId,
        });
      }

      const dbWithPrimary = ctx.db as DatabaseWithPrimary;
      if (dbWithPrimary.usePrimaryOnly) {
        ctx.db = dbWithPrimary.usePrimaryOnly();
      }
      routedToPrimary = true;
      routeReason = "mutation";
    } else {
      const cacheStart = DEBUG_PERF ? performance.now() : 0;
      const timestamp = await replicationCache.get(teamId);
      if (DEBUG_PERF) {
        perfLogger.info("replicationCache.get", {
          cacheMs: +(performance.now() - cacheStart).toFixed(2),
          teamId,
          hasTimestamp: timestamp !== undefined,
        });
      }

      if (timestamp && Date.now() < timestamp) {
        const dbWithPrimary = ctx.db as DatabaseWithPrimary;
        if (dbWithPrimary.usePrimaryOnly) {
          ctx.db = dbWithPrimary.usePrimaryOnly();
        }
        routedToPrimary = true;
        routeReason = "recent-mutation";
      }
    }
  } else {
    const dbWithPrimary = ctx.db as DatabaseWithPrimary;
    if (dbWithPrimary.usePrimaryOnly) {
      ctx.db = dbWithPrimary.usePrimaryOnly();
    }
    routedToPrimary = true;
    routeReason = "no-team";
  }

  if (DEBUG_PERF && routedToPrimary) {
    perfLogger.info("replicationRoute", {
      teamId,
      type,
      reason: routeReason,
    });
  }

  return next({ ctx });
};
