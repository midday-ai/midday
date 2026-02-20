import type { Session } from "@api/utils/auth";
import { withRetryOnPrimary } from "@api/utils/db-retry";
import { teamCache } from "@midday/cache/team-cache";
import type { Database } from "@midday/db/client";
import { TRPCError } from "@trpc/server";

export type TeamResolution = {
  teamId: string | null;
};

/**
 * Resolves the current user's team and verifies access.
 * Designed to be called once per HTTP request via a lazy promise on the
 * tRPC context, so batched procedures share a single DB query + cache hit.
 */
export async function resolveTeamPermission(
  session: Session | null,
  db: Database,
): Promise<TeamResolution> {
  const userId = session?.user?.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No permission to access this team",
    });
  }

  const result = await withRetryOnPrimary(
    db,
    async (db) => {
      return await db.query.users.findFirst({
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
    },
    { retryOnNull: true },
  );

  if (!result) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  const teamId = result.teamId;

  if (teamId !== null) {
    const cacheKey = `user:${userId}:team:${teamId}`;
    let hasAccess = await teamCache.get(cacheKey);

    if (hasAccess === undefined) {
      hasAccess = result.usersOnTeams.some(
        (membership) => membership.teamId === teamId,
      );

      await teamCache.set(cacheKey, hasAccess);
    }

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No permission to access this team",
      });
    }
  }

  return { teamId };
}

/**
 * tRPC middleware that enforces team permission.
 * Delegates to the shared lazy resolver on the context so the expensive
 * DB query + Redis check only executes once per HTTP request, even when
 * multiple procedures are batched together.
 */
export const withTeamPermission = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    db: Database;
    resolveTeam: () => Promise<TeamResolution>;
  };
  next: (opts: {
    ctx: {
      session?: Session | null;
      db: Database;
      teamId: string | null;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;

  const { teamId } = await ctx.resolveTeam();

  return next({
    ctx: {
      session: ctx.session,
      teamId,
      db: ctx.db,
    },
  });
};
