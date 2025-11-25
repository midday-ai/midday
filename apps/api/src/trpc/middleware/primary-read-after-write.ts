import type { Session } from "@api/utils/auth";
import { replicationCache } from "@midday/cache/replication-cache";
import type { Database, DatabaseWithPrimary } from "@midday/db/client";

// Database middleware that handles replication lag based on mutation operations
// For mutations: always use primary DB
// For queries: use primary DB if the team recently performed a mutation
// Also checks x-force-primary header to force primary reads for new users
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

  // If x-force-primary header is set, force primary DB reads (for new users)
  // For queries, we can return early. For mutations, we still need to update the cache.
  if (forcePrimary && type !== "mutation") {
    const dbWithPrimary = ctx.db as DatabaseWithPrimary;
    if (dbWithPrimary.usePrimaryOnly) {
      ctx.db = dbWithPrimary.usePrimaryOnly();
    }
    const result = await next({ ctx });
    return result;
  }

  if (teamId) {
    // For mutations, always use primary DB and update the team's timestamp
    if (type === "mutation") {
      await replicationCache.set(teamId);

      // Use primary-only mode to maintain interface consistency
      const dbWithPrimary = ctx.db as DatabaseWithPrimary;
      if (dbWithPrimary.usePrimaryOnly) {
        ctx.db = dbWithPrimary.usePrimaryOnly();
      }
      // If usePrimaryOnly doesn't exist, we're already using the primary DB
    }
    // For queries, check if the team recently performed a mutation
    else {
      const timestamp = await replicationCache.get(teamId);
      const now = Date.now();

      // If the timestamp exists and hasn't expired, use primary DB
      if (timestamp && now < timestamp) {
        // Use primary-only mode to maintain interface consistency
        const dbWithPrimary = ctx.db as DatabaseWithPrimary;
        if (dbWithPrimary.usePrimaryOnly) {
          ctx.db = dbWithPrimary.usePrimaryOnly();
        }
        // If usePrimaryOnly doesn't exist, we're already using the primary DB
      }
    }
  } else {
    // When no team ID is present, always use primary DB
    const dbWithPrimary = ctx.db as DatabaseWithPrimary;
    if (dbWithPrimary.usePrimaryOnly) {
      ctx.db = dbWithPrimary.usePrimaryOnly();
    }
    // If usePrimaryOnly doesn't exist, we're already using the primary DB
  }

  const result = await next({ ctx });

  return result;
};
