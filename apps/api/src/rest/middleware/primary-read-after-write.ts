import { logger } from "@api/utils/logger";
import { replicationCache } from "@midday/cache/replication-cache";
import { teamPermissionsCache } from "@midday/cache/team-permissions-cache";
import type { DatabaseWithPrimary } from "@midday/db/client";
import { getUserTeamId } from "@midday/db/queries";
import type { MiddlewareHandler } from "hono";

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
    teamId = teamPermissionsCache.get(cacheKey) || null;

    if (!teamId && session.user.id) {
      try {
        // Get user's current team
        const userTeamId = await getUserTeamId(db, session.user.id);

        if (userTeamId) {
          teamId = userTeamId;
          teamPermissionsCache.set(cacheKey, userTeamId);
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
      replicationCache.set(teamId);

      // Use primary-only mode to maintain interface consistency
      const dbWithPrimary = db as DatabaseWithPrimary;
      if (dbWithPrimary.usePrimaryOnly) {
        finalDb = dbWithPrimary.usePrimaryOnly();
      }
      // If usePrimaryOnly doesn't exist, we're already using the primary DB
    }
    // For queries, check if the team recently performed a mutation
    else {
      const timestamp = replicationCache.get(teamId);
      const now = Date.now();

      // If the timestamp exists and hasn't expired, use primary DB
      if (timestamp && now < timestamp) {
        // Use primary-only mode to maintain interface consistency
        const dbWithPrimary = db as DatabaseWithPrimary;
        if (dbWithPrimary.usePrimaryOnly) {
          finalDb = dbWithPrimary.usePrimaryOnly();
        }
      }
    }
  }

  // Set database and context in Hono context
  c.set("db", finalDb);
  c.set("session", session);
  c.set("teamId", teamId);

  await next();
};
