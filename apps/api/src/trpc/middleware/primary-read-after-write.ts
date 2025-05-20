import type { Database, DatabaseWithPrimary } from "@api/db";
import type { Session } from "@api/utils/auth";
import { logger } from "@api/utils/logger";
import { LRUCache } from "lru-cache";

// In-memory map to track teams who recently performed mutations.
// Note: This map is per server instance, and we typically run 1 instance per region.
// Otherwise, we would need to share this state with Redis or a similar external store.
// Key: teamId, Value: timestamp when they should be able to use replicas again
const cache = new LRUCache<string, number>({
  max: 5_000, // up to 5k entries
  ttl: 10000, // 10 seconds in milliseconds
});

// The window time in milliseconds to handle replication lag (10 seconds)
const REPLICATION_LAG_WINDOW = 10000;

// Database middleware that handles replication lag based on mutation operations
// For mutations: always use primary DB
// For queries: use primary DB if the team recently performed a mutation
export const withPrimaryReadAfterWrite = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    teamId?: string | null;
    db: Database;
  };
  type: "query" | "mutation" | "subscription";
  next: (opts: {
    ctx: {
      session?: Session | null;
      teamId?: string | null;
      db: Database;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, type, next } = opts;
  const teamId = ctx.teamId;

  if (teamId) {
    // For mutations, always use primary DB and update the team's timestamp
    if (type === "mutation") {
      // Set the timestamp when the team can use replicas again
      const expiryTime = Date.now() + REPLICATION_LAG_WINDOW;
      cache.set(teamId, expiryTime);

      logger.info({
        msg: "Using primary DB for mutation",
        teamId,
        operationType: type,
        replicaBlockUntil: new Date(expiryTime).toISOString(),
      });

      // Check if $primary exists on the Database instance
      const dbWithPrimary = ctx.db as DatabaseWithPrimary;
      if (dbWithPrimary.$primary) {
        ctx.db = dbWithPrimary.$primary;
      }
      // If not, we're already using the primary DB
    }
    // For queries, check if the team recently performed a mutation
    else {
      const timestamp = cache.get(teamId);
      const now = Date.now();

      // If the timestamp exists and hasn't expired, use primary DB
      if (timestamp && now < timestamp) {
        const remainingMs = timestamp - now;
        logger.info({
          msg: "Using primary DB for query after recent mutation",
          teamId,
          operationType: type,
          replicaBlockRemainingMs: remainingMs,
          replicaBlockUntil: new Date(timestamp).toISOString(),
        });

        // Check if $primary exists on the Database instance
        const dbWithPrimary = ctx.db as DatabaseWithPrimary;
        if (dbWithPrimary.$primary) {
          ctx.db = dbWithPrimary.$primary;
        }
        // If not, we're already using the primary DB
      } else {
        logger.debug({
          msg: "Using replica DB for query",
          teamId,
          operationType: type,
          recentMutation: !!timestamp,
        });
      }
    }
  } else {
    logger.debug({
      msg: "No team ID in context, using default DB routing",
      operationType: type,
    });
  }

  const start = performance.now();
  const result = await next({ ctx });
  const duration = performance.now() - start;

  if (duration > 500) {
    logger.warn({
      msg: "Slow DB operation detected",
      teamId,
      operationType: type,
      durationMs: Math.round(duration),
    });
  }

  return result;
};
