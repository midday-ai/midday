import type { DatabaseWithPrimary } from "@api/db";
import { users } from "@api/db/schema";
import { logger } from "@api/utils/logger";
import { eq } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";
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

// Cache for team permissions to avoid repeated database queries
const teamPermissionCache = new LRUCache<string, string>({
  max: 5_000, // up to 5k entries
  ttl: 1000 * 60 * 30, // 30 minutes in milliseconds
});

/**
 * Database middleware that handles replication lag based on mutation operations
 * For mutations: always use primary DB
 * For queries: use primary DB if the team recently performed a mutation
 */
export const withPrimaryReadAfterWrite: MiddlewareHandler = async (c, next) => {
  // Get session and database from context
  const session = c.get("session");
  const db = c.get("db");

  // Determine operation type based on HTTP method
  const method = c.req.method;
  const operationType = ["POST", "PUT", "PATCH", "DELETE"].includes(method)
    ? "mutation"
    : "query";

  let teamId: string | null = null;

  // Try to get teamId from session/user context
  if (session?.user?.id) {
    const cacheKey = `user:${session.user.id}:team`;
    teamId = teamPermissionCache.get(cacheKey) || null;

    if (!teamId) {
      try {
        // Get user's current team
        const result = await db.query.users.findFirst({
          columns: { teamId: true },
          where: eq(users.id, session.user.id),
        });

        if (result?.teamId) {
          teamId = result.teamId;
          teamPermissionCache.set(cacheKey, result.teamId);
        }
      } catch (error) {
        logger.warn({
          msg: "Failed to fetch user team",
          userId: session.user.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  let finalDb = db;

  if (teamId) {
    // For mutations, always use primary DB and update the team's timestamp
    if (operationType === "mutation") {
      // Set the timestamp when the team can use replicas again
      const expiryTime = Date.now() + REPLICATION_LAG_WINDOW;
      cache.set(teamId, expiryTime);

      logger.info({
        msg: "Using primary DB for mutation",
        teamId,
        operationType,
        method,
        path: c.req.path,
        replicaBlockUntil: new Date(expiryTime).toISOString(),
      });

      // Use primary-only mode to maintain interface consistency
      const dbWithPrimary = db as DatabaseWithPrimary;
      if (dbWithPrimary.usePrimaryOnly) {
        finalDb = dbWithPrimary.usePrimaryOnly();
      }
      // If usePrimaryOnly doesn't exist, we're already using the primary DB
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
          operationType,
          method,
          path: c.req.path,
          replicaBlockRemainingMs: remainingMs,
          replicaBlockUntil: new Date(timestamp).toISOString(),
        });

        // Use primary-only mode to maintain interface consistency
        const dbWithPrimary = db as DatabaseWithPrimary;
        if (dbWithPrimary.usePrimaryOnly) {
          finalDb = dbWithPrimary.usePrimaryOnly();
        }
        // If usePrimaryOnly doesn't exist, we're already using the primary DB
      } else {
        logger.debug({
          msg: "Using replica DB for query",
          teamId,
          operationType,
          method,
          path: c.req.path,
          recentMutation: !!timestamp,
        });
      }
    }
  } else {
    logger.debug({
      msg: "No team ID in context, using default DB routing",
      operationType,
      method,
      path: c.req.path,
      hasSession: !!session,
    });
  }

  // Set database and context in Hono context
  c.set("db", finalDb);
  c.set("session", session);
  c.set("teamId", teamId);

  const start = performance.now();
  await next();
  const duration = performance.now() - start;

  if (duration > 500) {
    logger.warn({
      msg: "Slow DB operation detected",
      teamId,
      operationType,
      method,
      path: c.req.path,
      durationMs: Math.round(duration),
    });
  }
};
