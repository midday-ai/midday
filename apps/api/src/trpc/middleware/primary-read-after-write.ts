import type { Database } from "@api/db";
import { logger } from "@api/utils/logger";

// In-memory map to track teams who recently performed mutations.
// Note: This map is per server instance, and we typically run 1 instance per region.
// Otherwise, we would need to share this state with Redis or a similar external store.
// Key: teamId, Value: timestamp when they should be able to use replicas again
const teamMutationMap = new Map<string, number>();

// The window time in milliseconds to handle replication lag (10 seconds)
const REPLICATION_LAG_WINDOW = 10000;

// Define a type that includes the optional $primary property
type DatabaseWithPrimary = Database & {
  $primary?: Database;
};

// Database middleware that handles replication lag based on mutation operations
// For mutations: always use primary DB
// For queries: use primary DB if the team recently performed a mutation
export const withPrimaryReadAfterWrite = async <TReturn>(opts: {
  ctx: {
    session?: { user?: { id?: string } };
    teamId?: string;
    db: Database;
  };
  type: "query" | "mutation" | "subscription";
  next: (opts: {
    ctx: {
      session?: { user?: { id?: string } };
      teamId?: string;
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
      teamMutationMap.set(teamId, expiryTime);

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
      const timestamp = teamMutationMap.get(teamId);
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

    // Clean up expired entries occasionally
    if (Math.random() < 0.1) {
      // ~10% chance to run cleanup on each request
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, value] of teamMutationMap.entries()) {
        if (now > value) {
          teamMutationMap.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.debug({
          msg: "Cleaned up expired mutation entries",
          cleanedCount,
          remainingEntries: teamMutationMap.size,
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
