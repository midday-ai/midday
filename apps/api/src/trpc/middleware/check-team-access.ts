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

export const withTeamAccess = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    teamId?: string | null;
    db: Database;
  };
  next: (opts: {
    ctx: {
      session?: Session | null;
      teamId?: string | null;
      db: Database;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;

  const userId = ctx.session?.user?.id;
  const teamId = ctx.teamId;

  if (!userId || !teamId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No permission to access this team",
    });
  }

  const cacheKey = `${userId}:${teamId}`;
  let hasAccess = cache.get(cacheKey);

  if (hasAccess === undefined) {
    const membership = await ctx.db.query.usersOnTeam.findFirst({
      columns: {
        id: true,
      },
      where: (usersOnTeam, { eq, and }) =>
        and(eq(usersOnTeam.userId, userId), eq(usersOnTeam.teamId, teamId)),
    });

    hasAccess = !!membership;
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
      teamId: ctx.teamId,
      db: ctx.db,
    },
  });
};
