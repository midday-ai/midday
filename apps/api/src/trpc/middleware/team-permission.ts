import type { Session } from "@api/utils/auth";
import { withRetryOnPrimary } from "@api/utils/db-retry";
import { teamCache } from "@midday/cache/team-cache";
import type { Database } from "@midday/db/client";
import { TRPCError } from "@trpc/server";

type TeamResolution = {
  teamId: string | null;
};

// Deduplicates the DB query + Redis check across all procedures in a batched
// tRPC request. tRPC creates one context object per HTTP request and passes
// the same reference to every procedure, so using it as a WeakMap key means
// the resolution runs once per batch. Entries are garbage-collected when the
// context goes out of scope (after the request completes).
const resolveCache = new WeakMap<object, Promise<TeamResolution>>();

async function resolveTeamPermission(
  session: Session | undefined | null,
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

export const withTeamPermission = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    db: Database;
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

  let resolution = resolveCache.get(ctx);
  if (!resolution) {
    resolution = resolveTeamPermission(ctx.session, ctx.db);
    resolveCache.set(ctx, resolution);
  }

  const { teamId } = await resolution;

  return next({
    ctx: {
      session: ctx.session,
      teamId,
      db: ctx.db,
    },
  });
};
