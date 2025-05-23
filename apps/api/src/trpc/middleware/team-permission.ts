import type { Database } from "@api/db";
import type { Session } from "@api/utils/auth";
import { TRPCError } from "@trpc/server";
import { LRUCache } from "lru-cache";

// In-memory cache to check if a user has access to a team
// Note: This cache is per server instance, and we typically run 1 instance per region.
// Otherwise, we would need to share this state with Redis or a similar external store.
const cache = new LRUCache<string, boolean>({
  max: 5_000, // up to 5k entries (adjust based on memory)
  ttl: 1000 * 60 * 30, // 30 minutes in milliseconds
});

export const withTeamPermission = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    db: Database;
  };
  next: (opts: {
    ctx: {
      session?: Session | null;
      db: Database;
      teamId: string;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;

  const userId = ctx.session?.user?.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No permission to access this team",
    });
  }

  const result = await ctx.db.query.users.findFirst({
    with: {
      usersOnTeams: {
        columns: {
          id: true,
          teamId: true,
        },
      },
    },
    where: (users, { eq }) => eq(users.id, userId),
  });

  if (!result) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  if (!result.teamId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User has no team assigned",
    });
  }

  const teamId = result.teamId;
  const cacheKey = `user:${userId}:team:${teamId}`;
  let hasAccess = cache.get(cacheKey);

  if (hasAccess === undefined) {
    hasAccess = result.usersOnTeams.some(
      (membership) => membership.teamId === teamId,
    );

    cache.set(cacheKey, hasAccess);
  }

  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No permission to access this team",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      teamId,
      db: ctx.db,
    },
  });
};
